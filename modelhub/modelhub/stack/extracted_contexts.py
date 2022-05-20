"""
Copyright 2021 Objectiv B.V.
"""
from typing import Any

from sql_models.model import SqlModelBuilder
from sql_models.util import is_bigquery, is_postgres, DatabaseNotSupportedException
from sqlalchemy.engine import Engine


class ExtractedContexts(SqlModelBuilder):
    def __init__(self, engine: Engine, **values: Any):
        self._engine = engine
        super().__init__(**values)

    @property
    def sql(self):
        if is_postgres(self._engine):
            return _POSTGRES_SQL

        elif is_bigquery(self._engine):
            ...

        raise DatabaseNotSupportedException(
            self._engine,
            message_override='Cannot extract context from provided engine.'
        )


_POSTGRES_SQL = \
    '''
    SELECT event_id,
            day,
            moment,
            cookie_id AS user_id,
            CAST(JSON_EXTRACT_PATH(value, 'global_contexts') AS jsonb) AS global_contexts,
            CAST(JSON_EXTRACT_PATH(value, 'location_stack') AS jsonb) AS location_stack,
            value->>'_type' AS event_type,
            CAST(JSON_EXTRACT_PATH(value, '_types') AS jsonb) AS stack_event_types
     FROM {table_name}
     {date_range}
     '''

_BIGQUERY_SQL = \
    '''
    
    '''
