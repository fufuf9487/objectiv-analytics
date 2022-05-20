import bach

from enum import Enum
from typing import Tuple, Dict, Any, List

from sql_models.util import is_bigquery
from sqlalchemy.engine import Engine


class ObjectivSupportedColumns(Enum):
    EVENT_ID = 'event_id'
    DAY = 'day'
    MOMENT = 'moment'
    USER_ID = 'user_id'
    GLOBAL_CONTEXTS = 'global_contexts'
    LOCATION_STACK = 'location_stack'
    EVENT_TYPE = 'event_type'
    STACK_EVENT_TYPES = 'stack_event_type'
    SESSION_ID = 'session_id'
    SESSION_HIT_NUMBER = 'session_hit_number'

    _DATA_SERIES = (
        DAY, MOMENT, USER_ID, GLOBAL_CONTEXTS, LOCATION_STACK, EVENT_TYPE,
        STACK_EVENT_TYPES, SESSION_ID, SESSION_HIT_NUMBER,
    )

    _INDEX_SERIES = (EVENT_ID, )

    _EXTRACTED_CONTEXT_COLUMNS = (
        EVENT_ID, DAY, MOMENT, USER_ID, GLOBAL_CONTEXTS, LOCATION_STACK, EVENT_TYPE, STACK_EVENT_TYPES,
    )

    _SESSIONIZED_COLUMNS = (
        SESSION_ID, SESSION_HIT_NUMBER,
    )

    @classmethod
    def get_extracted_context_columns(cls) -> Tuple['ObjectivSupportedColumns', ...]:
        return cls._EXTRACTED_CONTEXT_COLUMNS.value

    @classmethod
    def get_sessionized_columns(cls) -> Tuple['ObjectivSupportedColumns', ...]:
        return cls._SESSIONIZED_COLUMNS.value

# mapping for series names and dtypes
_OBJECTIV_SUPPORTED_COLUMNS_X_DTYPES = {
    ObjectivSupportedColumns.EVENT_ID: bach.SeriesUuid.dtype,
    ObjectivSupportedColumns.DAY: bach.SeriesDate.dtype,
    ObjectivSupportedColumns.MOMENT: bach.SeriesTimestamp.dtype,
    ObjectivSupportedColumns.USER_ID: bach.SeriesUuid.dtype,
    ObjectivSupportedColumns.GLOBAL_CONTEXTS: bach.SeriesJsonb.dtype,
    ObjectivSupportedColumns.LOCATION_STACK: bach.SeriesJsonb.dtype,
    ObjectivSupportedColumns.EVENT_TYPE: bach.SeriesString.dtype,
    ObjectivSupportedColumns.STACK_EVENT_TYPES: bach.SeriesJsonb.dtype,
    ObjectivSupportedColumns.SESSION_ID: bach.SeriesInt64.dtype,
    ObjectivSupportedColumns.SESSION_HIT_NUMBER: bach.SeriesInt64.dtype,
}


def get_supported_dtypes_per_objectiv_column(engine: Engine) -> Dict[ObjectivSupportedColumns, Any]:
    dtypes = _OBJECTIV_SUPPORTED_COLUMNS_X_DTYPES.copy()
    if is_bigquery(engine):
        dtypes[ObjectivSupportedColumns.GLOBAL_CONTEXTS] = [bach.SeriesDict.dtype]
        dtypes[ObjectivSupportedColumns.LOCATION_STACK] = [bach.SeriesDict.dtype]
        dtypes[ObjectivSupportedColumns.STACK_EVENT_TYPES] = [bach.SeriesString.dtype]

    return {col.value: dtype for col, dtype in dtypes.items()}


def check_objectiv_series_dtypes(
    df: bach.DataFrame, columns_to_check: List[ObjectivSupportedColumns],
) -> None:
    objectiv_dtypes = get_supported_dtypes_per_objectiv_column(df.engine)
    for col in columns_to_check:
        supported_col = ObjectivSupportedColumns(col) if isinstance(col, str) else col
        if supported_col.value not in df.data_columns:
            raise ValueError(f'{supported_col.value} is not present in DataFrame.')

        dtype = objectiv_dtypes[supported_col.value]
        if df[supported_col.value].instance_dtype != dtype:
            raise ValueError(f'{supported_col.value} must be {dtype} dtype.')