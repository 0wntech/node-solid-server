const locationUrl = location.href.split("/");
locationUrl.shift();
locationUrl.shift();

const providerFields = document.getElementsByClassName("provider");
for (var i = 0; i < providerFields.length; i++) {
  providerFields[i].innerHTML = locationUrl[0].split(".")[0].toLowerCase();
}
