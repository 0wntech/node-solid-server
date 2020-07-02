"use strict";

const debug = require("./../debug").authentication;
const acl = require("../acl-checker");
const aclClient = require("ownacl");

const AuthRequest = require("./auth-request");

const url = require("url");
const intoStream = require("into-stream");

const $rdf = require("rdflib");
const ACL = $rdf.Namespace("http://www.w3.org/ns/auth/acl#");

/**
 * Models a local Login request
 */
class SharingRequest extends AuthRequest {
  /**
   * @constructor
   * @param options {Object}
   *
   * @param [options.response] {ServerResponse} middleware `res` object
   * @param [options.session] {Session} req.session
   * @param [options.userStore] {UserStore}
   * @param [options.accountManager] {AccountManager}
   * @param [options.returnToUrl] {string}
   * @param [options.authQueryParams] {Object} Key/value hashmap of parsed query
   *   parameters that will be passed through to the /authorize endpoint.
   * @param [options.authenticator] {Authenticator} Auth strategy by which to
   *   log in
   */
  constructor(options) {
    super(options);

    this.authenticator = options.authenticator;
    this.authMethod = options.authMethod;
  }

  /**
   * Factory method, returns an initialized instance of LoginRequest
   * from an incoming http request.
   *
   * @param req {IncomingRequest}
   * @param res {ServerResponse}
   * @param authMethod {string}
   *
   * @return {LoginRequest}
   */
  static fromParams(req, res) {
    let options = AuthRequest.requestOptions(req, res);

    return new SharingRequest(options);
  }

  /**
   * Handles a Login GET request on behalf of a middleware handler, displays
   * the Login page.
   * Usage:
   *
   *   ```
   *   app.get('/login', LoginRequest.get)
   *   ```
   *
   * @param req {IncomingRequest}
   * @param res {ServerResponse}
   */
  static async get(req, res) {
    const request = SharingRequest.fromParams(req, res);

    const appUrl = request.getAppUrl();
    const appOrigin = `${appUrl.protocol}//${appUrl.host}`;
    const serverUrl = new url.URL(req.app.locals.ldp.serverUri);

    // Check if is already registered or is data browser or the webId is not on this machine
    if (request.isUserLoggedIn()) {
      if (
        !request.isSubdomain(
          serverUrl.host,
          new url.URL(request.session.subject._id).host
        ) ||
        (appUrl &&
          request.isSubdomain(serverUrl.host, appUrl.host) &&
          appUrl.protocol === serverUrl.protocol) ||
        (await request.isAppRegistered(
          req.app.locals.ldp,
          appOrigin,
          request.session.subject._id
        ))
      ) {
        request.setUserShared(appOrigin);
        request.redirectPostSharing();
      } else {
        const webId = request.session.subject._id;
        request.renderForm(null, req, appOrigin, webId);
      }
    } else {
      request.redirectPostSharing();
    }
  }

  /**
   * Performs the login operation -- loads and validates the
   * appropriate user, inits the session with credentials, and redirects the
   * user to continue their auth flow.
   *
   * @param request {LoginRequest}
   *
   * @return {Promise}
   */
  static async share(req, res) {
    let consented = false;

    let files = req.body.files || [];
    let accessMode = [];
    if (req.body) {
      if (!Array.isArray(files)) {
        files = [files];
      }
      consented = req.body.consent;
    }

    if (files) {
      accessMode = files.map((file) => {
        return req.body[`accessMode[${file}]`];
      });
    }

    let request = SharingRequest.fromParams(req, res);
    const appUrl = request.getAppUrl();
    const appOrigin = `${appUrl.protocol}//${appUrl.host}`;

    if (request.isUserLoggedIn()) {
      debug("Sharing App");

      if (consented) {
        await request.registerApp(
          req.app.locals.ldp,
          req,
          { files: files, accessMode: accessMode },
          request.session.subject._id
        );
        if (files.includes("all")) request.setUserShared(appOrigin);
      }

      // Redirect once that's all done
      request.redirectPostSharing();
    } else {
      res.clearCookie("connect.sid");
      res.status(300);
      res.redirect("/login");
    }
  }

  isSubdomain(domain, subdomain) {
    const domainArr = domain.split(".");
    const subdomainArr = subdomain.split(".");
    for (let i = 1; i <= domainArr.length; i++) {
      if (
        subdomainArr[subdomainArr.length - i] !==
        domainArr[domainArr.length - i]
      ) {
        return false;
      }
    }
    return true;
  }

  setUserShared(appOrigin) {
    if (!this.session.consentedOrigins) {
      this.session.consentedOrigins = [];
    }
    if (!this.session.consentedOrigins.includes(appOrigin)) {
      this.session.consentedOrigins.push(appOrigin);
    }
  }

  isUserLoggedIn() {
    // Ensure the user arrived here by logging in
    return !!(this.session.subject && this.session.subject._id);
  }

  getAppUrl() {
    return url.parse(decodeURIComponent(this.authQueryParams.redirect_uri));
  }

  getGraph(ldp, url) {
    return new Promise(async (resolve, reject) => {
      const store = $rdf.graph();
      ldp
        .readResource(url)
        .then((graphText) => {
          $rdf.parse(
            graphText.toString(),
            store,
            this.getGraphFile(url),
            "text/turtle",
            (error, kb) => {
              if (error) {
                reject(error);
              } else {
                resolve(kb);
              }
            }
          );
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async saveGraph(ldp, store, url) {
    const text = $rdf.serialize(
      undefined,
      store,
      this.getGraphFile(url),
      "text/turtle"
    );
    await ldp.put(url, intoStream(text), "text/turtle");
  }

  getGraphFile(urlParam) {
    const urlurl = url.parse(urlParam);
    return `${urlurl.protocol}//${urlurl.host}${urlurl.pathname}`;
  }

  isAppRegistered(ldp, appOrigin, appAccessFile) {
    return this.getGraph(ldp, appAccessFile)
      .then((store) => {
        return store
          .each($rdf.sym(appAccessFile), ACL("trustedApp"))
          .find((app) => {
            return store
              .each(app, ACL("origin"))
              .find((rdfAppOrigin) => rdfAppOrigin.value === appOrigin);
          });
      })
      .catch((err) => {
        debug(err);
        return false;
      });
  }

  async registerAppInProfile(ldp, appOrigin, accessModes, webId) {
    debug(
      `Registering app (${appOrigin}) with accessModes ${accessModes} for webId ${webId}`
    );

    const store = await this.getGraph(ldp, webId);
    console.log("DEBUGGGG " + webId);
    const origin = $rdf.sym(appOrigin);
    // remove existing statements on same origin - if it exists
    store.statementsMatching(null, ACL("origin"), origin).forEach((st) => {
      store.removeStatements([
        ...store.statementsMatching(null, ACL("trustedApp"), st.subject),
      ]);
      store.removeStatements([...store.statementsMatching(st.subject)]);
    });

    console.log("DEBUGGGG " + webId);
    // add new triples
    const application = new $rdf.BlankNode();
    store.add($rdf.sym(webId), ACL("trustedApp"), application, webId);
    store.add(application, ACL("origin"), origin, webId);

    console.log("DEBUGGGG " + webId);

    accessModes.forEach((mode) => {
      store.add(application, ACL("mode"), ACL(mode));
    });
    return this.saveGraph(ldp, store, webId);
  }

  async registerApp(ldp, req, access, webId) {
    const appUrl = this.getAppUrl();
    const appOrigin = `${appUrl.protocol}//${appUrl.host}`;

    if (access.files.includes("all")) {
      await this.registerAppInProfile(
        ldp,
        appOrigin,
        access.accessMode[access.files.lastIndexOf("all")],
        webId
      );
    } else {
      await Promise.all(
        access.files.map((accessObj) => {
          const fileACL = acl.createFromLDPAndRequest(accessObj.file, ldp, req);
          return fileACL.getNearestACL().then((aclFile) => {
            const acl = new aclClient(aclFile);
            return acl.addOrigin({
              name: appOrigin,
              access:
                access.accessMode[access.files.lastIndexOf(accessObj.file)],
            });
          });
        })
      );
    }
  }

  /**
   * Returns a URL to redirect the user to after login.
   * Either uses the provided `redirect_uri` auth query param, or simply
   * returns the user profile URI if none was provided.
   *
   * @param validUser {UserAccount}
   *
   * @return {string}
   */
  postSharingUrl() {
    return this.authorizeUrl();
  }

  /**
   * Redirects the Login request to continue on the OIDC auth workflow.
   */
  redirectPostSharing() {
    let uri = this.postSharingUrl();
    debug("Login successful, redirecting to ", uri);
    this.response.redirect(uri);
  }

  /**
   * Renders the login form
   */
  renderForm(error, req, appOrigin, webId) {
    let queryString = (req && req.url && req.url.replace(/[^?]+\?/, "")) || "";
    let params = Object.assign({}, this.authQueryParams, {
      registerUrl: this.registerUrl(),
      returnToUrl: this.returnToUrl,
      enablePassword: this.localAuth.password,
      enableTls: this.localAuth.tls,
      tlsUrl: `/login/tls?${encodeURIComponent(queryString)}`,
      app_origin: appOrigin,
      webId: webId,
    });

    if (error) {
      params.error = error.message;
      this.response.status(error.statusCode);
    }

    this.response.render("auth/sharing", params);
  }
}

module.exports = {
  SharingRequest,
};
