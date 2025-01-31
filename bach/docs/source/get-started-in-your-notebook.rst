.. _get_started_in_your_notebook:

.. frontmatterposition:: 5

============================
Get started in your notebook
============================

You can run Objectiv in your favorite notebook. From a self-hosted Jupyter to the cloud with 
`Google Colab <https://colab.research.google.com/>`_, `Hex <https://hex.tech/>`_ and 
`Deepnote <https://deepnote.com>`_. 

Here’s how you can use Objectiv in these different notebooks:

Jupyter
-------

1: Install the open model hub locally

.. code-block:: console

	pip install objectiv-modelhub

2: Import the required packages, at the start of your notebook

.. code-block:: python

	from modelhub import ModelHub

3: Instantiate the model hub and set the default time aggregation

.. code-block:: python

	modelhub = ModelHub(time_aggregation='%Y-%m-%d')

4: Setup the db connection (optionally first create a local SSH tunnel)

.. code-block:: python

	df = modelhub.get_objectiv_dataframe(db_url='postgresql://USER:PASSWORD@HOST:PORT/DATABASE',
		start_date='2022-06-01',
		end_date='2022-06-30',
		table_name='data')

Google Colab / Hex / Deepnote
-----------------------------

1: Install the open model hub at the start of your notebook

.. code-block:: console

	pip install objectiv-modelhub

2: Import the required packages, next in your notebook

.. code-block:: python

	from modelhub import ModelHub

3: Instantiate the model hub and set the default time aggregation

.. code-block:: python

	modelhub = ModelHub(time_aggregation='%Y-%m-%d')

4: Optionally: create an SSH tunnel to the Postgres database server


.. code-block:: python
	
    pip install sshtunnel
   
.. code-block:: python

    from sshtunnel import SSHTunnelForwarder
    import os, stat

    # SSH tunnel configuration
    ssh_host = ''
    ssh_port = 22
    ssh_username = ''
    ssh_passphrase = ''
    ssh_private_key= ''
    db_host = ''
    db_port = 5432

    try:
        pk_path = '._super_s3cret_pk1'
        with open(pk_path, 'a') as pkf:
            pkf.write(ssh_private_key)
            os.chmod(pk_path, stat.S_IREAD)

        ssh_tunnel = SSHTunnelForwarder(
            (ssh_host, ssh_port),
            ssh_username=ssh_username,
            ssh_private_key=pk_path,
            ssh_private_key_password=ssh_passphrase,
            remote_bind_address=(db_host, db_port)
        )
        ssh_tunnel.start()
        os.remove(pk_path)
        tunnel_port = ssh_tunnel.local_bind_port

    except Exception as e:
        os.remove(pk_path)
        raise(e)

5: Setup the db connection

.. code-block:: python

    df = modelhub.get_objectiv_dataframe(
        db_url=f'postgresql://USER:PASSWORD@localhost:{tunnel_port}/DATABASE',
        start_date='2022-06-01',
        end_date='2022-06-30',
        table_name='data')


*For Deepnote specifically:*
as very first step: create a requirements.txt, add below and restart the machine:

.. code-block:: python

	pandas==1.4.1

Next steps
---------------

After these steps, you're ready to go! Check out the :doc:`example notebooks <./example-notebooks/index>` 
and the :doc:`open model hub <open-model-hub/index>` for where to take this next.
