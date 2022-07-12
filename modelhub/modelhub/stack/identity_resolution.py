"""
Copyright 2022 Objectiv B.V.
"""
from typing import Dict, Optional

import bach
from sqlalchemy.engine import Engine

from modelhub import (
    get_extracted_contexts_df,
    get_sessionized_data,
    ExtractedContextsPipeline,
    SessionizedDataPipeline
)
from modelhub.stack.base_pipeline import BaseDataPipeline
from modelhub.stack.util import ObjectivSupportedColumns, get_supported_dtypes_per_objectiv_column


class IdentityResolutionPipeline(BaseDataPipeline):
    """
    Pipeline in charge of resolving user identities based on `IdentityContext`.
    This pipeline is dependent on the result from ExtractedContextsPipeline, therefore it expects that
    the result from the latter is generated correctly.

    If sessionized data is required, the pipeline will solve identities based on the result from
    SessionizedDataPipeline.

    The steps followed in this pipeline are the following:
        1. get_extracted_contexts_df: Gets the generated DataFrame from ExtractedContextsPipeline.
        2. _validate_extracted_context_df: Validates if result from previous step
            has user_id, global_contexts and moment series.
        3. _extract_identities_from_global_contexts: Creates new identity (user id) id
            and name values from the first IdentityContext value found for the event
            under the global_contexts series json. Returns a DataFrame considering the last
            registered identity for each user_id. If no identity was found, user_id is not considered.
        4. _resolve_original_user_ids: Replaces original user_ids with the ones extracted from previous step,
            only if an identity was found for it.
        5. get_sessionized_data (Optional): If required, sessionized data will be calculated based on
            the new values from user_id series.
        6. _anonymize_user_ids_without_identity: If user_id has no identity, original value will be replaced
            with NULL. This step is required after getting sessionized data, since it's required to treat
            anonymous users as individual users.
        5. _convert_dtypes: Will convert all required identity series to their correct dtype

    Final bach DataFrame will be later validated, it must include:
        - all context series defined in ObjectivSupportedColumns. Sessionized series will be validated if
          requested
    """

    RESOLVED_USER_ID_SERIES_NAME = 'identity_user_id'
    IDENTITY_FORMAT = "({}) || '|' || ({})"

    def _get_pipeline_result(
        self,
        identity_id: Optional[str] = None,
        with_sessionized_data: bool = True,
        **kwargs,
    ) -> bach.DataFrame:
        # initial data is the result from ExtractedContextsPipeline
        context_df = get_extracted_contexts_df(
            engine=self._engine, table_name=self._table_name, set_index=False, **kwargs,
        )

        self._validate_extracted_context_df(context_df)

        # TODO: make user_id dtype default to str as identity resolution will always return str values
        context_df[ObjectivSupportedColumns.USER_ID.value] = (
            context_df[ObjectivSupportedColumns.USER_ID.value].astype(bach.SeriesString.dtype)
        )
        identity_context_df = self._extract_identities_from_global_contexts(context_df, identity_id)

        context_df = self._resolve_original_user_ids(context_df, identity_context_df)
        if with_sessionized_data:
            result = get_sessionized_data(
                engine=self._engine,
                table_name=self._table_name,
                set_index=False,
                extracted_contexts_df=context_df,
                **kwargs,
            )
        else:
            result = context_df.copy()

        # anonymize user ids
        result = self._anonymize_user_ids_without_identity(result)
        result = result.drop(columns=[self.RESOLVED_USER_ID_SERIES_NAME])

        df = self._convert_dtypes(df=result)
        return df

    @classmethod
    def validate_pipeline_result(
        cls, result: bach.DataFrame, with_sessionized_data: bool = True, **kwargs,
    ) -> None:
        """
        Checks if we are returning required Objectiv series with respective dtype.
        """
        if with_sessionized_data:
            SessionizedDataPipeline.validate_pipeline_result(result)
        else:
            ExtractedContextsPipeline.validate_pipeline_result(result)

    @property
    def result_series_dtypes(self) -> Dict[str, str]:
        return {
            ObjectivSupportedColumns.USER_ID.value: bach.SeriesString.dtype
        }

    def _validate_extracted_context_df(self, df: bach.DataFrame) -> None:
        # make sure the context_df has AT LEAST the following series
        supported_dtypes = get_supported_dtypes_per_objectiv_column()
        expected_context_columns = [
            ObjectivSupportedColumns.USER_ID.value,
            ObjectivSupportedColumns.GLOBAL_CONTEXTS.value,
            ObjectivSupportedColumns.MOMENT.value,
        ]

        self._validate_data_dtypes(
            expected_dtypes={col: supported_dtypes[col] for col in expected_context_columns},
            current_dtypes=df.dtypes,
        )

    def _extract_identities_from_global_contexts(
        self, df: bach.DataFrame, identity_id: Optional[str] = None,
    ) -> bach.DataFrame:
        """
        Generates a dataframe containing the last encountered unique identity per user_id.

        This is performed by:
            1. Extract the first IdentityContext where `id` value matches the provided identity_id param value
                from the event's global_contexts. If `identity_id` is None, then the first IdentityContext
                found will be used instead.
            2. Drop rows where events have no IdentityContext
            3. Create the new user id based on the IdentityContext's id and name.
                Follows the following format:
                {id}|{name}
            4. Consider only the last identity from the user's last event

        returns a bach DataFrame with two series: user_id and identity_user_id.
            user-id is the user_id series from the provided `df` DataFrame
            identity_user_id is the new user_id in the format {id}|{name}
        """
        global_context_series = (
            df[ObjectivSupportedColumns.GLOBAL_CONTEXTS.value]
            .copy_override_type(bach.SeriesJson)
        )

        user_id_series_name = ObjectivSupportedColumns.USER_ID.value
        moment_series_name = ObjectivSupportedColumns.MOMENT.value

        identity_context_df = df[[user_id_series_name, moment_series_name]]

        # Extract first identity context for the event
        identity_slice_filter = {'_type': 'IdentityContext'}
        if identity_id:
            identity_slice_filter['id'] = identity_id

        gc_array_slice = slice(identity_slice_filter, None)
        identity_context_df['identity_context_series'] = global_context_series.json[gc_array_slice].json[0]

        # drop events that have no identity
        identity_context_df = identity_context_df.dropna(subset=['identity_context_series'])

        # extract id and name values for the identity and create new user id
        identity_context_series = (
            identity_context_df['identity_context_series'].copy_override_type(bach.SeriesJson)
        )
        resolved_expr = bach.expression.Expression.construct(
            self.IDENTITY_FORMAT,
            identity_context_series.json.get_value('value', as_str=True),
            identity_context_series.json.get_value('id', as_str=True),
        )
        identity_context_df[self.RESOLVED_USER_ID_SERIES_NAME] = (
            identity_context_df[user_id_series_name].copy_override(expression=resolved_expr)
        )

        identity_context_df = identity_context_df.materialize(node_name='extracted_id_and_name')

        # keep the last registered identity for the user
        identity_context_df = identity_context_df.drop_duplicates(
            subset=[user_id_series_name], keep='last', sort_by=moment_series_name, ascending=True,
        )
        return identity_context_df[[user_id_series_name, self.RESOLVED_USER_ID_SERIES_NAME]]

    def _resolve_original_user_ids(
        self, df_to_resolve: bach.DataFrame, identity_context_df: bach.DataFrame,
    ) -> bach.DataFrame:
        """
        Replaces values from original user_id series with the extracted identities
        iff the identity is not NULL, otherwise original value is kept.

        Returns a DataFrame with updated user_ids and a new series for identity_user_id.
        """
        user_id_series_name = ObjectivSupportedColumns.USER_ID.value

        df_to_resolve = df_to_resolve.merge(
            identity_context_df, on=[user_id_series_name], how='left',
        )

        # replace user_ids with respective identity
        has_identity = df_to_resolve[self.RESOLVED_USER_ID_SERIES_NAME].notnull()
        df_to_resolve.loc[has_identity, user_id_series_name] = (
            df_to_resolve[self.RESOLVED_USER_ID_SERIES_NAME]
        )

        return df_to_resolve

    def _anonymize_user_ids_without_identity(self, df: bach.DataFrame) -> bach.DataFrame:
        """
        If user_id has no identity, then it will be anonymized by replacing original value with NULL.
        """
        if self.RESOLVED_USER_ID_SERIES_NAME not in df.data_columns:
            raise Exception(
                (
                    f'Cannot anonymize user ids if {self.RESOLVED_USER_ID_SERIES_NAME} series '
                    'is not present in DataFrame data columns.'
                )
            )

        df = df.copy()
        has_no_identity = df[self.RESOLVED_USER_ID_SERIES_NAME].isnull()
        df.loc[has_no_identity, ObjectivSupportedColumns.USER_ID.value] = None
        return df


def get_identity_resolution_data(
    engine: Engine,
    table_name: str,
    set_index: bool = True,
    identity_id: Optional[str] = None,
    with_sessionized_data: bool = True,
    **kwargs,
) -> bach.DataFrame:
    """
    Resolves user identity based on IdentityContext value from extracted contexts.
    :param engine: db connection
    :param table_name: table from where to extract data
    :param set_index: set index series for final dataframe
    :param identity_id: identifier type of IdentityContext to use for resolution.
        (e.g. email, supplier cookie, etc).
        If not provided, the first IdentityContext found for the event will be considered instead.
    :param with_sessionized_data: if true, result will include calculated session data.

    returns a bach DataFrame
    """
    pipeline = IdentityResolutionPipeline(engine=engine, table_name=table_name)
    result = pipeline(identity_id=identity_id, with_sessionized_data=with_sessionized_data, **kwargs)
    if set_index:
        indexes = list(ObjectivSupportedColumns.get_index_columns())
        result = result.set_index(keys=indexes)

    return result
