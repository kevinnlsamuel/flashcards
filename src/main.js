const worker = new Worker(new URL("./worker.js", import.meta.url), {
	type: "module",
});

const deck = new URLSearchParams(location.search).get('deck') || 'gr1.002-vocab'
worker.onerror = console.error;
worker.onmessage = handleWorkerMessage;
worker.postMessage({ type: "ping" });
worker.postMessage({ type: "load", deckUrl: `../decks/${deck}.min.json` });

fetch('../decks.json')
	.then(res => res.json()
		.then(decks => {
			const target = document.getElementById('deck-list')
			for (const _deck of decks) {
					const name = _deck.replace('.min.json','')
				target.append(
					Object.assign(
						document.createElement('option'),
						{
							value: name,
							innerText: name,
							selected: name === deck,
						}
					)
				)
			}
		})
	)

const mainEle = document.getElementById("main");
const startBtn = document.getElementById("action-start");
const stopBtn = document.getElementById("action-stop");
const showBtn = document.getElementById("action-show");

const prevBtn = document.getElementById("action-prev");
const nextBtn = document.getElementById("action-next");
const revealBtn = document.getElementById("action-reveal");
const restartBtn = document.getElementById("action-restart");

const explainDiag = document.getElementById("explanation");
const dlContainer = document.querySelector("#full-list.container");

const termBoxes = document.querySelectorAll(".term");
const defnBoxes = document.querySelectorAll(".explanation");

startBtn.addEventListener("click", () => {
	mainEle.dataset.state = "playing";
	document.body.dataset.state = "playing";
	worker.postMessage({ type: "next" });
});
stopBtn.addEventListener("click", () => {
	mainEle.dataset.state = "landing";
	document.body.dataset.state = "landing";
	updateCard({ term: "???", defn: "!!!" });
});
showBtn.addEventListener("click", () => {
	worker.postMessage({ type: "all" });
});

explainDiag.addEventListener("click", ({ target: target }) => {
	if (target.nodeName === "DIALOG") target.close();
});
revealBtn.addEventListener("click", () => {
	explainDiag.showModal();
});
restartBtn.addEventListener("click", () => {
	worker.postMessage({ type: "restart" });
});

nextBtn.addEventListener("click", () => worker.postMessage({ type: "next" }));
prevBtn.addEventListener("click", () => worker.postMessage({ type: "prev" }));

function updateCard(nextCard) {
	termBoxes.forEach((node) => (node.innerText = nextCard.term));
	defnBoxes.forEach((node) => (node.innerText = nextCard.defn));
}
function endButton(btn) {
	Object.assign(btn, {
		textContent: "|",
		disabled: true,
	});
}
function activateButton(btn) {
	Object.assign(btn, {
		textContent: btn.title === "next" ? ">" : "<",
		disabled: false,
	});
}
function endDeck(direction) {
	if (direction === "fwd") {
		endButton(nextBtn);
		restartBtn.style.display = "block";
	}
	if (direction === "bck") {
		endButton(prevBtn);
	}
}
function startDeck() {
	endButton(prevBtn);
	activateButton(nextBtn);
	restartBtn.style.display = "none";
}
function populateList(dataList) {
	if (dlContainer.dataset.populated === "true") return;

	const dl = document.createElement("dl");
	dataList.forEach((item) => {
		dl.appendChild(
			Object.assign(document.createElement("dt"), {
				textContent: item.term,
				className: "term",
			})
		);
		dl.appendChild(
			Object.assign(document.createElement("dd"), {
				textContent: item.defn,
				className: "explanation",
			})
		);
	});
	dlContainer.replaceChild(dl, dlContainer.children[0]);
	dlContainer.dataset.populated = true;
}

function handleWorkerMessage(msg) {
	switch (msg.data.type) {
		case "pong":
			console.log("received pong from worker!");
			break;
		case "update":
			updateCard(msg.data.content);
			break;
		case "loaded":
			document.querySelectorAll(".wait-load").forEach((e) => (e.disabled = false));
			break;

		case "all":
			populateList(msg.data.content);
			mainEle.dataset.state = "listing";
			document.body.dataset.state = "listing";
			break;
		case "start":
			if (msg.data.dir === "fwd") {
				activateButton(nextBtn);
				break;
			}
			activateButton(prevBtn);
			break;
		case "end":
			endDeck(msg.data.dir);
			break;
		case "reset":
			startDeck();
			worker.postMessage({ type: "next" });
			break;
		default:
			throw `unknown message from worker: ${msg.data.type}`;
	}
}
