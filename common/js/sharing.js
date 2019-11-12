const rdf = $rdf;
const store = rdf.graph();
const fetcher = new rdf.Fetcher(store);

//const configUrl = [appOrigin, "app.ttl"].join("/");

$(document).ready(() => {
  if (
    (access.includes("") !== -1 && access.includes("") !== -1) ||
    access.includes("http://www.w3.org/ns/solid/terms#Account") !== -1
  ) {
    renderFullAccess();
  }
});

function renderFullAccess() {
  const root = webId.replace("profile/card#me", "");
  displayResource({
    fileName: root,
    fileType: "folder",
    permissions: { read: true, write: true, control: true }
  });
  displayDataType({ name: "Account Access", icon: "" });
}

function displayResource(resource) {
  const { fileName, fileType, permissions } = resource;
  const resourceHtml = `

  <div class="resource">
    <div class="resourceDescription">
        <div class="resourceIconWrapper">
        <img class="resourceIcon" src="/common/img/${
          fileType === "folder" ? "Folder Icon.png" : "File Icon.png"
        }" />
        </div>
        <div class="resourceName">${fileName}</div>
    </div>
    <div class="accessModes">
        <div class="accessMode">
        <input type="checkbox" name="access_mode" value="Read" class="accessOption" ${
          permissions.read ? "checked" : ""
        }/>
        <div class="accessOptionName">Read</div>
        </div>
        <div class="accessMode">
        <input type="checkbox" name="access_mode" value="Write" class="accessOption" ${
          permissions.write ? "checked" : ""
        }/>
        <div class="accessOptionName">Write</div>
        </div>
        <div class="accessMode">
        <input type="checkbox" name="access_mode" value="Control" class="accessOption" ${
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
