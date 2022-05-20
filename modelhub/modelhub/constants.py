from enum import Enum
from typing import Tuple

from bach import SeriesDict
from bach.series import (
    SeriesDate, SeriesTimestamp, SeriesUuid, SeriesJsonb, SeriesString, SeriesInt64, SeriesJson,
)
from sql_models.util import is_postgres, is_bigquery, DatabaseNotSupportedException
from sqlalchemy.engine import Engine


class ObjectiveSupportedColumnsDtypes(Enum):
    EVENT_ID = SeriesUuid.dtype
    DAY = SeriesDate.dtype
    MOMENT = SeriesTimestamp.dtype
    COOKIE_ID = SeriesUuid.dtype
    VALUE = SeriesJson.dtype

    USER_ID = SeriesUuid.dtype
    GLOBAL_CONTEXTS = SeriesJsonb.dtype
    LOCATION_STACK = SeriesJsonb.dtype
    EVENT_TYPE = SeriesString.dtype
    STACK_EVENT_TYPES = SeriesJsonb.dtype
    SESSION_ID = SeriesInt64.dtype
    SESSION_HIT_NUMBER = SeriesInt64.dtype

    CONTEXTS_IO_OBJECTIV_TAXONOMY_1_0_0 = [SeriesDict.dtype]

    _REQUIRED_SERIES = (EVENT_ID, DAY, MOMENT, COOKIE_ID, VALUE)

    _DATA_SERIES = (
        DAY, MOMENT, USER_ID, GLOBAL_CONTEXTS, LOCATION_STACK, EVENT_TYPE,
        STACK_EVENT_TYPES, SESSION_ID, SESSION_HIT_NUMBER,
    )

    _INDEX_SERIES = (EVENT_ID, )

    @classmethod
    def get_expected_columns_by_engine(
        cls, engine: Engine,
    ) -> Tuple['ObjectiveSupportedColumnsDtypes', ...]:
        if is_postgres(engine):
            return cls.EVENT_ID, cls.DAY, cls.MOMENT, cls.COOKIE_ID, cls.VALUE

        if is_bigquery(engine):
            return cls.CONTEXTS_IO_OBJECTIV_TAXONOMY_1_0_0,

        raise DatabaseNotSupportedException(engine)

