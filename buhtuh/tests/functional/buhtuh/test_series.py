"""
Copyright 2021 Objectiv B.V.
"""
import numpy as np
import pandas as pd
import pytest

from tests.functional.buhtuh.test_data_and_utils import get_bt_with_test_data, assert_equals_data, df_to_list, \
    get_from_df


def test_series__getitem__():
    bt = get_bt_with_test_data(full_data_set=False)
    assert bt.city[1] == 'Ljouwert'
    assert bt.count().city_count[1] == 3

    # make sure getitem works when multiple nodes are in play.
    l1 = bt.groupby('municipality').count()
    l2 = l1.groupby().city_count.sum()
    assert l2[1] == 3



def test_series_sort_values():
    bt = get_bt_with_test_data(full_data_set=True)
    bt_series = bt.city
    kwargs_list = [{'ascending': True},
                   {'ascending': False},
                   {}
                   ]
    for kwargs in kwargs_list:
        assert_equals_data(
            bt_series.sort_values(**kwargs),
            expected_columns=['_index_skating_order', 'city'],
            expected_data=df_to_list(bt.to_df()['city'].sort_values(**kwargs))
        )


def test_fillna():
    values = [1, np.nan, 3, np.nan, 7]
    pdf = pd.DataFrame(data=values)
    bt = get_from_df('test_fillna', pdf)
    tf = lambda x: \
        np.testing.assert_equal(pdf[0].fillna(x).values, bt['0'].fillna(x).head(10).values)

    assert(bt['0'].dtype == 'float64')
    tf(1.25)
    tf(float(99))
    tf(np.nan)

    # pandas allows this, but we can't
    for val in [int(99), 'nope']:
        with pytest.raises(TypeError):
            bt['0'].fillna(val)


def test_isnull():
    values = ['a', 'b', None]
    pdf = pd.DataFrame(data=values,columns=['text_with_null'])
    bt = get_from_df('test_isnull', pdf)
    bt['y'] = bt.text_with_null.isnull()
    bt['z'] = bt.text_with_null.notnull()

    assert_equals_data(
        bt,
        expected_columns=['_index_text_with_null', 'text_with_null', 'y', 'z'],
        expected_data=[['a', 'a', False, True],
                       ['b', 'b', False, True],
                       [None, None, True, False]
                       ]
    )


def test_type_agnostic_aggregation_functions():
    bt = get_bt_with_test_data(full_data_set=True)
    btg = bt.groupby()

    # type agnostic aggregations
    aggregation_functions = ['count', 'max', 'min', 'nunique', 'mode', 'median']
    result_bt = btg[['municipality']].aggregate(aggregation_functions)

    result_series_dtypes = {
        'municipality_count': 'int64',
        'municipality_max': 'string',
        'municipality_min': 'string',
        'municipality_nunique': 'int64',
        'municipality_mode': 'string',
        'municipality_median': 'string'
    }

    assert_equals_data(
        result_bt,
        expected_columns=['index'] + list(result_series_dtypes.keys()),
        expected_data=[
            [1, 11, 'Waadhoeke', 'De Friese Meren', 6, 'Súdwest-Fryslân', 'Súdwest-Fryslân']
        ]
    )
    assert result_bt.index_dtypes == {
        'index': 'int64'
    }
    assert result_bt.dtypes == result_series_dtypes


def test_dataframe_agg_skipna_parameter():
    # test full parameter traversal
    bt = get_bt_with_test_data(full_data_set=True)[['inhabitants']]

    series_agg = ['count', 'max', 'median', 'min', 'mode', 'nunique']
    for agg in series_agg:
        with pytest.raises(NotImplementedError):
            # currently not supported anywhere, so needs to raise
            bt.agg(agg, skipna=False)


def test_series_direct_aggregation():
    # test full parameter traversal
    bt = get_bt_with_test_data(full_data_set=True)

    btg = bt.groupby('municipality')
    print(bt.inhabitants.sum(btg).head())


def test_series_independant_subquery_any_all():
    bt = get_bt_with_test_data(full_data_set=True)
    s = bt.inhabitants.max() // 4

    bt[bt.inhabitants > s.any()].head()
    result_bt = bt[bt.inhabitants > s.all()]

    assert_equals_data(
        result_bt[['city', 'inhabitants']],
        expected_columns=['_index_skating_order', 'city', 'inhabitants'],
        expected_data=[
            [1, 'Ljouwert', 93485], [2, 'Snits', 33520]
        ]
    )


def test_series_independant_subquery_sets():
    bt = get_bt_with_test_data(full_data_set=True)
    # get 3 smallest cities
    s = bt.sort_values('inhabitants', True)[:3]
    result_bt = bt[bt.city.isin(s.city)]
    assert_equals_data(
        result_bt[['city', 'inhabitants']],
        expected_columns=['_index_skating_order', 'city', 'inhabitants'],
        expected_data=[
            [4, 'Sleat', 700], [5, 'Starum', 960], [6, 'Hylpen', 870]
        ]
    )

    result_bt = bt[~bt.city.isin(s.city)]
    assert_equals_data(
        result_bt[['city', 'inhabitants']],
        expected_columns=['_index_skating_order', 'city', 'inhabitants'],
        expected_data=[
            [1, 'Ljouwert', 93485], [2, 'Snits', 33520], [3, 'Drylts', 3055], [7, 'Warkum', 4440],
            [8, 'Boalsert', 10120], [9, 'Harns', 14740], [10, 'Frjentsjer', 12760], [11, 'Dokkum', 12675]
        ]
    )


def test_series_independant_subquery_single():
    bt = get_bt_with_test_data(full_data_set=True)
    # get smallest city
    s = bt.sort_values('inhabitants', True)[:1]
    result_bt = bt[bt.city == s.city]
    assert_equals_data(
        result_bt[['city', 'inhabitants']],
        expected_columns=['_index_skating_order', 'city', 'inhabitants'],
        expected_data=[
            [4, 'Sleat', 700]
        ]
    )
    # and some math
    bt = get_bt_with_test_data(full_data_set=False)
    result_bt = bt.inhabitants + s.inhabitants
    assert_equals_data(
        result_bt,
        expected_columns=['_index_skating_order', 'inhabitants'],
        expected_data=[
            [1, 94185], [2, 34220], [3, 3755]
        ]
    )


def test_series_different_aggregations():
    bt = get_bt_with_test_data(full_data_set=True)
    v =  bt.groupby('municipality').skating_order.nunique() / bt.skating_order.nunique()
    assert_equals_data(
        v,
        expected_columns=['municipality', 'skating_order'],
        expected_data=[['De Friese Meren', 0.09090909090909091], ['Harlingen', 0.09090909090909091],
                       ['Leeuwarden', 0.09090909090909091], ['Noardeast-Fryslân', 0.09090909090909091],
                       ['Súdwest-Fryslân', 0.5454545454545454], ['Waadhoeke', 0.09090909090909091]]
    )
    # TODO we could try to detect this.
    with pytest.raises(Exception, match='more than one row returned by a subquery used as an expression'):
        v = bt.skating_order.nunique() / bt.groupby('municipality').skating_order.nunique()
        v.head()
