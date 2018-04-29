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
8. Verify the service is running by navigating to [the swagger documentation](http://localhost:4001/api-docs)

## Git Workflow Used

If you're interested in contributing, see the [CONTRIBUTING.md](CONTRIBUTING.md) notes. You'll see several branches in this repository:

 * master - The **master** branch contains the latest stable release of the UHC API
 * develop - The **develop** branch contains the latest unstable development code for the UHC API
 * release/XXX - The **release** branches are branches which are used for maintenance of older releases of the UHC API. We tag each release as well.
 * feature/XXX - The **feature** branches are branches where third party developers typically stage new features to the UHC API. The UHC team typically prunes these once the feature is merged into **develop**
 * issue/XXXX - The **issue** branches are branches where third party developers typically stage bug fixes to reported issues on the UHC API. The UHC team typically prunes these once the bug fix is merged into **develop**