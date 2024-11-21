//import { parse } from 'yaml';
import { load, next, prev } from "./DeckFunctions.js";

let deckfile;
let originalDeck = [];
let completedCardList = [];
let remainingCardList = [];
let currentIndex = 0;

onmessage = async (msg) => {
	switch (msg.data.type) {
		case "ping":
			const decks = await load('./decks.json')
			postMessage({ type: "pong", decks });
			break;
		case "all":
			postMessage({ type: "all", content: originalDeck });
			break;
		case "prev":
			currentIndex -= 1;
			if (currentIndex > 0) {
				postMessage(prev(currentIndex, completedCardList));
			}
			if (currentIndex === 1) {
				postMessage({ type: "end", dir: "bck" });
			}
			if (currentIndex < completedCardList.length)
				postMessage({ type: "start", dir: "fwd" });
			break;

		case "next":
			currentIndex += 1;
			if (completedCardList.length === 1 || currentIndex === 2)
				postMessage({ type: "start" });

			if (currentIndex <= completedCardList.length) {
				postMessage({
					type: "update",
					content: completedCardList.at(currentIndex - 1),
				});
				if (remainingCardList.length === 0)
					postMessage({ type: "end", dir: "fwd" });
				break;
			}

			let { res, index } = next(remainingCardList);
			postMessage(res);
			completedCardList.push(res.content);
			remainingCardList.splice(index, 1);
			if (remainingCardList.length === 0) {
				postMessage({ type: "end", dir: "fwd" });
			}
			break;
		case "load":
			if (!msg.data.deckUrl) throw "deckUrl not provided for loading";
			deckfile = await load(msg.data.deckUrl);
			originalDeck = deckfile.deck
			remainingCardList = structuredClone(originalDeck);
			postMessage({ type: "loaded" });
			break;
		case "restart":
			remainingCardList = structuredClone(originalDeck);
			completedCardList = [];
			currentIndex = 0;
			postMessage({ type: "reset" });
			break;
		default:
			throw `unknown message type received from main ${msg.data.type}`;
	}
};
