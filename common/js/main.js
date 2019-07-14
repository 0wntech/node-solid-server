document.querySelector("#message").innerHTML =
        "You do not have the permissions to access " + location.href + ".";
const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
const VCARD = $rdf.Namespace('http://www.w3.org/2006/vcard/ns#');
          
const store = $rdf.graph();
const fetcher = new $rdf.Fetcher(store);
fetcher.load(webId).then(() => {
  const profilePic = store.each($rdf.sym(webId), VCARD("hasPhoto"))[0];
  const profilePicValue = profilePic ? profilePic.value : undefined;
  const name = store.each($rdf.sym(webId), FOAF("name"))[0];
  const nameValue = name ? name.value : undefined;
  let profileString = profilePicValue ? `<div class="profileIcon" style="backgroundImage: 'url(' + ${profilePicValue} + ')'"/>` : "";
  profileString += nameValue ? `<div class="username">${nameValue}</div>` : "";
  document.querySelector(".profileSection").innerHTML = profileString;
});
