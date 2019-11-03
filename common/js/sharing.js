const rdf = $rdf;
const store = rdf.graph();
const fetcher = new rdf.Fetcher(store);

//const configUrl = [appOrigin, "app.ttl"].join("/");
const configUrl = "https://drive.owntech.io/app.ttl";

fetch(configUrl).then(res => {
  console.log(res);
});

fetcher.load(configUrl).then(() => {
  console.log(store.each());
});
