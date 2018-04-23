# Universal Health Coin API
*Enabling easy access to UHC assets*

## What is the UHC API?

The Universal Health Coin (UHC) API provides a wrapper to wallets on the backend blockchain, allowing more novice end-users to interact with with 
third party providers of services and other wallets.

In short, the UHC API provides:

* A simple OAUTH 2.0 token service allowing a "Log in with UHC" function
* The ability to query, read, and post transactions to the UHC user wallets
* The ability to acquire UHC tokens with a third party credit card processor

## Getting Started

To get started with the UHC API you will need to install the following pre-requisites:

* NodeJS 8.11 or later
* PostgreSQL 9.4 or later
* Python 2.7
* OpenSSL

To setup / run:

1. Clone the UHC API project. **master** contains the latest stable release and **develop** contains the latest development release. 
   ```
   $ git clone https://github.com/UHCToken/uhc-api.git
   $ cd uhc-api
   $ git checkout develop
   ```
2. Refresh the node libraries using NPM:
   ```
   $ npm update
   ```
3. Create the UHC database:
   ```
   $ sudo su - postgres
   $ psql
   # CREATE USER uhc PASSWORD 'XXXXXXXX';
   # CREATE DATABASE uhc OWNER uhc;
   # \q
   $ exit
   ```
   **Note:** These instructions are using a Linux console, for environments with a user interface we suggest using PGAdmin.
4. Install the UHC schema
   ```
   $ cat uhc.sql | psql -h localhost -U uhc -W --dbname=uhc
   ```
5. Configure the API by copying the sample configuration file
   ```
   $ cp config.empty.js config.js
   ```
   **Note:** Ensure that your configuration parameters are correct before running the next step
6. Run the unit tests for the API
   ```
   $ npm test
   ```
7. Run the API
   ```
   $ node app.js
   ```
   