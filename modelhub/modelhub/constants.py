from enum import Enum
from bach.series import SeriesDate, SeriesTimestamp, SeriesUuid, SeriesJsonb, SeriesString, SeriesInt64


class PostgresSupportedSeries(Enum):
    DAY = SeriesDate
    MOMENT = SeriesTimestamp
    USER_ID = SeriesUuid
    GLOBAL_CONTEXTS = SeriesJsonb
    LOCATION_STACK = SeriesJsonb
    EVENT_TYPE = SeriesString
    STACK_EVENT_TYPES = SeriesJsonb
    SESSION_ID = SeriesInt64
    SESSION_HIT_NUMBER = SeriesInt64

    EVENT_ID = SeriesUuid

    _DATA_SERIES = (
        DAY, MOMENT, USER_ID, GLOBAL_CONTEXTS, LOCATION_STACK, EVENT_TYPE,
        STACK_EVENT_TYPES, SESSION_ID, SESSION_HIT_NUMBER,
    )

    _INDEX_SERIES = (EVENT_ID, )


class BigQuerySupportedSeries(Enum):
    APP_ID = SeriesString
    PLATFORM = SeriesString
    ETL_TIMESTAMP = SeriesTimestamp
    COLLECTOR_TIMESTAMP = SeriesTimestamp
    EVENT = SeriesString
    EVENT_ID = SeriesString
    V_TRACKER = SeriesString
    V_COLLECTOR = SeriesString
    V_ETL = SeriesString

