.. _example_notebooks:

=================
Example notebooks
=================


Here are several examples of how you can analyze and model data using the open model hub. All examples are
also available as Jupyter notebooks from our `GitHub repository
<https://github.com/objectiv/objectiv-analytics/tree/main/notebooks>`_ and can run if all `requirements
<https://github.com/objectiv/objectiv-analytics/blob/main/notebooks/requirements.txt>`_ are
installed.

To get started you will first have to
instantiate the open model hub and create a Bach DataFrame with Objectiv data. The open
model hub uses this DataFrame for its models. For a general introduction to Bach DataFrames, see the
:ref:`Bach <bach>` docs or some basic examples to get started :ref:`here <bach_examples>`.

.. Generate links in the toctree, but don't show the TOC itself in this page
.. rst-class:: hide_toctree_ul

.. toctree::
    :maxdepth: 1

    modelhub_basics
    product_analytics
    open_taxonomy
    feature_engineering
    machine_learning


.. _get_started_with_objectiv:

Getting started with Objectiv
-----------------------------

Here we show how to install and instantiate the model hub.
The open model hub is installed with

    pip install objectiv-modelhub

Now we can import and instantiate the model hub and create a Bach DataFrame with Objectiv data. This
DataFrame is used to analyze data collected with Objectiv’s Tracker.
The DataFrame points to the data in the SQL database and all operations are done on this object. A start date
and an end date can
optionally be passed to limit the underlying data that is queried. The `time_aggregation` parameter determines
the default formatting of the timestamp of events. This is useful for grouping to different time aggregations,
ie. monthly or daily.

In the example we assume that the data collected with Objectiv's tracker is stored in a table called
'example' in a database that can be accessed with `db_url`.

.. code-block:: python

    from modelhub import ModelHub
    # instantiate the model hub
    modelhub = ModelHub(time_aggregation='YYYY-MM-DD')
    # get the Bach DataFrame with Objectiv data
    df = modelhub.get_objectiv_dataframe(db_url='postgresql://objectiv:@localhost:5432/objectiv',
                                         start_date='2022-03-01',
                                         table_name='example')

Your DataFrame is instantiated! We start with showing the first couple of rows from the data set.

.. code-block:: python

    df.head()

Take a look at one of the example notebooks below to see how you can analyze your data. Basic Bach
introduction examples are :ref:`here <bach_examples>` in the Bach docs.

* :ref:`Open model hub basics <example_modelhub_basics>`
* :ref:`Basic product analytics <example_product_analytics>`
* :ref:`Open taxonomy how-to <example_open_taxonomy>`
* :ref:`Feature engineering with Bach <example_feature_engineering>`
* :ref:`Bach and sklearn <example_machine_learning>`
