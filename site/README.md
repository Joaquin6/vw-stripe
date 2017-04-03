# Vision Wheel Dealers




## Getting Started



## PostgresSQL Database

> PostgresSQL Database was our preference for storing collected and parsed data. The following will help you understand the structure behind the Database.


#### Parameters

| Main User (Owner) | Database Name           | Host                 | Port   |
|:------------------|:------------------------|:---------------------|:-------|
| `postgres_admin`  | `visionwheeldealers-qa` | `lab-pg-db.mirum.la` | `5432` |

#### Extensions

| Name       	 | Version | Schema       | Last Updated | Updated By        | Description                                      	|
|:---------------|:--------|:-------------|:-------------|:------------------|:-----------------------------------------------------|
| `plpgsql`  	 | `1.0`   | `pg_catalog` | `2016-09-30` | `Joaquin Briceno` | `PL/pgSQL procedural language`                   	|
| `plv8`         | `1.4.4` | `pg_catalog` | `2016-09-30` | `Joaquin Briceno` | `PL/JavaScript (v8) trusted procedural language` 	|
| `postgres_fdw` | `1.0`   | `public` 	  | `2016-09-30` | `Joaquin Briceno` | `foreign-data wrapper for remote PostgreSQL servers` |