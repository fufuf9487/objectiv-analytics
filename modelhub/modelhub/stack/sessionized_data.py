"""
Copyright 2021 Objectiv B.V.
"""
from enum import Enum

import bach
from sqlalchemy.engine import Engine

from modelhub.stack.util import (
    ObjectivSupportedColumns, get_supported_dtypes_per_objectiv_column, check_objectiv_series_dtypes
)
from modelhub.stack.base_pipeline import BaseDataPipeline
from modelhub.stack.extracted_contexts import get_extracted_contexts_df, ExtractedContextsPipeline


class _BaseCalculatedSessionSeries(Enum):
    IS_START_OF_SESSION = 'is_start_of_session'
    SESSION_START_ID = 'session_start_id'
    SESSION_COUNT = 'is_one_session'


class SessionizedDataPipeline(BaseDataPipeline):
    # requested context_df MUST have at least this columns
    required_columns_x_dtypes = {
        ObjectivSupportedColumns.EVENT_ID.value: bach.SeriesUuid.dtype,
        ObjectivSupportedColumns.USER_ID.value: bach.SeriesUuid.dtype,
        ObjectivSupportedColumns.MOMENT.value: bach.SeriesTimestamp.dtype,
    }

    def _get_pipeline_result(self, session_gap_seconds=180, **kwargs) -> bach.DataFrame:
        context_df = get_extracted_contexts_df(engine=self._engine, table_name=self._table_name, **kwargs)
        self._validate_data_columns(current_columns=context_df.data_columns)

        sessionized_df = self._calculate_base_session_series(context_df, session_gap_seconds=session_gap_seconds)

        # adds required objectiv session series
        sessionized_df = self._calculate_objectiv_session_series(sessionized_df)
        sessionized_df = self._convert_dtypes(sessionized_df)

        final_columns = (
            context_df.data_columns + list(ObjectivSupportedColumns.get_sessionized_columns())
        )
        sessionized_df = sessionized_df[final_columns]

        return sessionized_df

    @classmethod
    def validate_pipeline_result(cls, result: bach.DataFrame) -> None:
        ExtractedContextsPipeline.validate_pipeline_result(result)
        check_objectiv_series_dtypes(
            result, columns_to_check=list(ObjectivSupportedColumns.get_sessionized_columns()),
        )

    def _convert_dtypes(self, df: bach.DataFrame) -> bach.DataFrame:
        df_cp = df.copy()
        objectiv_dtypes = get_supported_dtypes_per_objectiv_column(self._engine)
        for col in ObjectivSupportedColumns.get_sessionized_columns():
            if col not in df_cp.data:
                continue

            df_cp[col] = df_cp[col].copy_override_dtype(
                dtype=df_cp[col].dtype,
                instance_dtype=objectiv_dtypes[col],
            )

        return df_cp

    def _calculate_base_session_series(self, df: bach.DataFrame, session_gap_seconds: int) -> bach.DataFrame:
        sessionized_df = df.copy()

        is_session_start_series = self._calculate_session_start(sessionized_df, session_gap_seconds)
        sessionized_df[is_session_start_series.name] = is_session_start_series
        # materialize since rest of series are dependant and it uses a window function
        sessionized_df = sessionized_df.materialize(node_name='session_starts')

        session_start_id_series = self._calculate_session_start_id(sessionized_df)
        sessionized_df[session_start_id_series.name] = session_start_id_series

        session_count_series = self._calculate_session_count(sessionized_df)
        sessionized_df[session_count_series.name] = session_count_series
        return sessionized_df.materialize(node_name='session_id_and_count')

    @staticmethod
    def _calculate_objectiv_session_series(df: bach.DataFrame) -> bach.DataFrame:
        sort_by = [ObjectivSupportedColumns.MOMENT.value, ObjectivSupportedColumns.EVENT_ID.value]
        group_by = [_BaseCalculatedSessionSeries.SESSION_COUNT.value]
        window = df.sort_values(by=sort_by).groupby(group_by).window()

        df_cp = df.copy()
        session_start_id_series = df_cp[_BaseCalculatedSessionSeries.SESSION_START_ID.value]

        session_id_series_name = ObjectivSupportedColumns.SESSION_ID.value
        df_cp[session_id_series_name] = session_start_id_series.copy_override(
            expression=session_start_id_series.window_first_value(window=window).expression,
            name=session_id_series_name,
        )

        session_hit_number_series_name = ObjectivSupportedColumns.SESSION_HIT_NUMBER.value
        df_cp[session_hit_number_series_name] = session_start_id_series.copy_override(
            expression=session_start_id_series.window_row_number(window=window).expression,
            name=session_hit_number_series_name,
        )

        return df_cp.materialize(node_name='objectiv_sessionized_data')

    @staticmethod
    def _calculate_session_start(df: bach.DataFrame, session_gap_seconds) -> bach.SeriesBoolean:
        sort_by = [ObjectivSupportedColumns.MOMENT.value, ObjectivSupportedColumns.EVENT_ID.value]
        group_by = [ObjectivSupportedColumns.USER_ID.value]
        window = df.sort_values(by=sort_by).groupby(by=group_by).window()

        moment_series = df[ObjectivSupportedColumns.MOMENT.value]

        # create lag series with correct expression
        # this way we avoid materializing when doing an arithmetic operation with window function result
        lag_moment = moment_series.copy_override(expression=moment_series.window_lag(window=window).expression)
        lag_moment = lag_moment.copy_override_type(bach.SeriesTimestamp)

        total_duration_session = moment_series - lag_moment

        result_series_name = _BaseCalculatedSessionSeries.IS_START_OF_SESSION.value
        df_cp = df.copy()
        df_cp[result_series_name] = True
        df_cp.loc[total_duration_session.dt.total_seconds <= session_gap_seconds, result_series_name] = False
        return df_cp[result_series_name]

    @staticmethod
    def _calculate_session_start_id(df: bach.DataFrame) -> bach.SeriesInt64:
        sort_by = [ObjectivSupportedColumns.MOMENT.value, ObjectivSupportedColumns.EVENT_ID.value]
        group_by = [ObjectivSupportedColumns.USER_ID.value]
        window = df.sort_values(by=sort_by).groupby(by=group_by).window()

        start_session_series = df[_BaseCalculatedSessionSeries.IS_START_OF_SESSION.value]
        session_start_id = start_session_series.copy_override(
            expression=start_session_series.window_row_number(window=window).expression,
        )
        session_start_id = session_start_id.copy_override_type(bach.SeriesInt64)

        result_series_name = _BaseCalculatedSessionSeries.SESSION_START_ID.value
        df_cp = df.copy()
        df_cp[result_series_name] = -1
        df_cp.loc[start_session_series, result_series_name] = session_start_id
        return df_cp[result_series_name]

    @staticmethod
    def _calculate_session_count(df: bach.DataFrame) -> bach.SeriesInt64:
        sort_by = [
            ObjectivSupportedColumns.USER_ID.value,
            ObjectivSupportedColumns.MOMENT.value,
            ObjectivSupportedColumns.EVENT_ID.value,
        ]
        window = df.sort_values(by=sort_by).groupby().window()

        start_session_series = df[_BaseCalculatedSessionSeries.IS_START_OF_SESSION.value]
        return start_session_series.copy_override(
            expression=start_session_series.count(partition=window).expression,
            name=_BaseCalculatedSessionSeries.SESSION_COUNT.value,
        ).copy_override_type(bach.SeriesInt64)


def get_sessionized_data(engine: Engine, table_name: str, **kwargs) -> bach.DataFrame:
    pipeline = SessionizedDataPipeline(engine=engine, table_name=table_name)
    return pipeline(**kwargs)


_SQL = \
    '''
    with session_starts_{{id}} as (
        select
            *,
            case when coalesce(
                extract(
                    epoch from (moment - lag(moment, 1)
                        over (partition by user_id order by moment, event_id))
                ) > {session_gap_seconds},
                true
            ) then true end as is_start_of_session
        from {{extracted_contexts}}
    ),
    session_id_and_start_{{id}} as (
        select
            *,
            -- generates a session_start_id for each is_start_of_session
            case
                when is_start_of_session then
                    row_number() over (partition by is_start_of_session order by moment, event_id)
            end as session_start_id,
            -- generates a unique number for each session, but not in the right order.
            count(is_start_of_session) over (order by user_id, moment, event_id) as is_one_session
        from session_starts_{{id}}
    )
    select
        *,
        -- populates the correct session_id for all rows with the same value for is_one_session
        first_value(
            session_start_id
        ) over (
            partition by is_one_session order by moment, event_id
        ) as session_id,
        row_number() over (partition by is_one_session order by moment, event_id) as session_hit_number
    from session_id_and_start_{{id}}
    '''
