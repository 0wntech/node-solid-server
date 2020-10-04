const providerFields = document.getElementsByClassName("provider");
for (var i = 0; i < providerFields.length; i++) {
  providerFields[i].innerHTML = location.host;
}