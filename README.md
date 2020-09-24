# ADAMOS HUB Single Sign-On (SSO) for Cumulocity with Angular

This sample app demonstrates how to log in and out using the ADAMOS HUB IAM Server in the context of ADAMOS IIoT Platform (Cumulocity).

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 9.0.4.

## Prerequisites

To run through this tutorial, you need to fulfill the following prerequisites:

- You have a tenant on the ADAMOS IIoT Platform with administrator permissions
- You have a tenant on the ADAMOS HUB with a
	- **valid user and password** - You receive these upon registering on the ADAMOS HUB
- Your company is registered as a Seller on the ADAMOS HUB
- You have an active application subscription with an according
	- **client ID** - which identifies the application on your ADAMOS HUB tenant
    - **client secret** - a secret only known to you and the ADAMOS HUB IAM server
	- **URL** - which is whitelisted as redirect URL (for login) for your application

> Note: In order to obtain a tenant on the ADAMOS IIoT Platform you either need to have a valid ADAMOS IIoT Platform contract or at least a trial tenant. If you do not have such a contract, yet, and are interested in one, please get in touch with our sales team at sales@adamos.com. Trial tenants are available for 30 days free of charge and can be registered for through the ADAMOS Partner Portal.

> Note: To obtain a tenant on the ADAMOS HUB, you need to <a href="https://enablement.adamos.com/adamos-id/registrierung" target="_blank">register on the ADAMOS HUB</a>. In order to become a Seller, you need to apply for a Seller upgrade from within your ADAMOS HUB Control Center. You will receive the client ID and the whitelisting of the redirect URL as soon as you register an application in the ADAMOS HUB and provision it for a subscriber. You can still walk through this tutorial without this information, however, in order to launch the app from ADAMOS HUB myApps you will need the before mentioned information and update your app with it.

## Configuration

Since this app is made in the context of the ADAMOS IIoT Platform, all of the needed SSO configuration will be done in the platform itself (in the Administration application).

## Install dependencies

Run `npm install` or `yarn install` in order to install the needed dependencies.

## Run

Run `npm start` or `yarn start` and open [http://localhost:4200](http://localhost:4200) in your browser. If everything is correctly setup you should be redirected to the login page of the ADAMOS HUB IAM Server.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.