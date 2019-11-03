const rdf = $rdf;
const store = rdf.graph();
const fetcher = new rdf.Fetcher(store);

//const configUrl = [appOrigin, "app.ttl"].join("/");

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
        <input type="checkbox" class="accessOption" ${
          permissions.read ? "checked" : ""
        }/>
        <div class="accessOptionName">Read</div>
        </div>
        <div class="accessMode">
        <input type="checkbox" class="accessOption" ${
          permissions.write ? "checked" : ""
        }/>
        <div class="accessOptionName">Write</div>
        </div>
        <div class="accessMode">
        <input type="checkbox" class="accessOption" ${
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
