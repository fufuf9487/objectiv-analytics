"""
Copyright 2021 Objectiv B.V.
"""
import string
from typing import Set

from sqlalchemy.engine import Engine


def extract_format_fields(format_string: str, nested=1) -> Set[str]:
    """
    Given a python format string, return a set with all field names.

    If nested is set, it will do x rounds of:
        1. find field names in input string
        2. fill out values for field names. Use this as input string for step 1.

    Examples:
        extract_format_fields('{x} {{y}} {{{{z}}}} {a}', 1) == {'x', 'a'}
        extract_format_fields('{x} {{y}} {{{{z}}}} {a}', 2) == {'y'}
        extract_format_fields('{x} {{y}} {{{{z}}}} {a}', 3) == {'z'}
        extract_format_fields('{x} {{y}} {{{{z}}}}', 3)     == {'z'}
    """
    formatter = string.Formatter()
    fields = set()
    items = list(formatter.parse(format_string))
    for item in items:
        _literal_text, field_name, _format_spec, _conversion = item
        if field_name is not None:
            fields.add(field_name)
    if nested == 1:
        return fields
    dummy_values = {field_name: 'x' for field_name in fields}
    new_format_string = format_string.format(**dummy_values)
    return extract_format_fields(new_format_string, nested=nested-1)


def quote_identifier(engine: Engine, name: str) -> str:
    """
    Add quotes around an identifier (e.g. a table or column name), and escape special characters in the name.

    This is in accordance with the Postgres string notation format, no guarantees for other databses.
    See https://www.postgresql.org/docs/14/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS

    Examples:
    >>> quote_identifier('test')
    '"test"'
    >>> quote_identifier('te"st')
    '"te""st"'
    >>> quote_identifier('"te""st"')
    '\"\"\"te\"\"\"\"st\"\"\"'
    """
    if engine.name == 'postgresql':
        replaced_chars = name.replace('"', '""')
        return f'"{replaced_chars}"'
    elif engine.name == 'bigquery':
        replaced_chars = name.replace('`', '``')
        return f'`{replaced_chars}`'
    else:
        raise ValueError(f"Unsupported engine name: {engine.name}")


def quote_string(engine: Engine, value: str) -> str:
    """
    Add single quotes around the value and escape any quotes in the value.

    This is in accordance with the Postgres string notation format, no guarantees for other databses.
    See https://www.postgresql.org/docs/14/sql-syntax-lexical.html#SQL-SYNTAX-CONSTANTS

    Examples:
    >>> quote_string("test")
    "'test'"
    >>> quote_string("te'st")
    "'te''st'"
    >>> quote_string("'te''st'")
    "'''te''''st'''"
    """
    replaced_chars = value.replace("'", "''")
    return f"'{replaced_chars}'"
