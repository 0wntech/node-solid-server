const rdf = $rdf;
const store = rdf.graph();
const fetcher = new rdf.Fetcher(store);

//const configUrl = [appOrigin, "app.ttl"].join("/");

$(document).ready(async () => {
  const access = await fetchAccessForApp();
  if (
    !access ||
    access.includes("/") !== -1 ||
    access.includes("http://www.w3.org/ns/solid/terms#Account") !== -1
  ) {
    renderFullAccess();
  }
});

function fetchAccessForApp() {
  const configUrl = appOrigin + "app.ttl";
  const ns = {
    app: new rdf.Namespace("http://schema.org/SoftwareApplication/"),
    dct: new rdf.Namespace("http://purl.org/dc/terms/"),
    acl: new rdf.Namespace("http://www.w3.org/ns/auth/acl#"),
    ldp: new rdf.Namespace("https://www.w3.org/ns/ldp#")
  };

  return fetcher
    .load(configUrl)
    .then(() => {
      const thisApp = rdf.sym(configUrl);
      const permissionNode = store.any(thisApp, ns.app("permissions"));
      const permissions = store
        .statementsMatching(permissionNode, ns.dct("description"))
        .map(permission => {
          console.log(permission);
          if (permission.object.termType === "BlankNode") {
            const permissionName = store.any(
              permission.object,
              ns.dct("description")
            ).value;
            const accessModes = store
              .each(permission.object, ns.acl("mode"))
              .map(accessMode => accessMode.value);
            return {
              name: permissionName,
              icon: "",
              accessModes: accessModes
            };
          } else {
            return {
              name: permission.object.value,
              icon: "",
              accessModes: [
                ns.acl("Read").value,
                ns.acl("Write").value,
                ns.acl("Control").value
              ]
            };
          }
        });

      return permissions;
    })
    .catch(err => {
      return;
    });
}

function renderFullAccess() {
  displayResource({
    file: "All Data",
    fileType: "folder",
    permissions: { read: true, write: true, control: true }
  });
  displayDataType({ name: "Account Access", icon: "" });
}

function displayResource(resource) {
  const { file: fileDisplay, fileType, permissions } = resource;
  const fileName = fileDisplay === "All Data" ? "all" : fileDisplay;
  const resourceHtml = `
  <div class="resource">
    <div class="resourceDescription">
        <div class="resourceIconWrapper">
        <img class="resourceIcon" src="/common/img/${
          fileType === "folder" ? "Folder Icon.png" : "File Icon.png"
        }" />
        </div>
        <div class="resourceName">${fileDisplay}</div>
        <input type="hidden" name="files" value="${fileName}"/>
    </div>
    <div class="accessModes">
        <div class="accessMode">
        <input type="checkbox" name="accessMode[${fileName}]" value="Read" class="accessOption" ${
    permissions.read ? "checked" : ""
  }/>
        <div class="accessOptionName">Read</div>
        </div>
        <div class="accessMode">
        <input type="checkbox" name="accessMode[${fileName}]" value="Write" class="accessOption" ${
    permissions.write ? "checked" : ""
  }/>
        <div class="accessOptionName">Write</div>
        </div>
        <div class="accessMode">
        <input type="checkbox" name="accessMode[${fileName}]" value="Control" class="accessOption" ${
    permissions.control ? "checked" : ""
  }/>
        <div class="accessOptionName">Control</div>
        </div>
    </div>
  </div>`;
  $(".resources").append(resourceHtml);
}

function displayDataType(datatype) {
  const { name, icon } = datatype;
  const dataTypeHtml = `
  <div class="dataType">
    <div class="dataTypeIcon">
        <img src=${icon}/>
    </div>
    <div class="dataTypeName">
        ${name}
    </div>
  </div>`;
  $(".dataTypes").append(dataTypeHtml);
}
