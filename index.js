"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// INITIALIZATION:
// connect keplr wallet extension
function getKeplr() {
    return __awaiter(this, void 0, void 0, function* () {
        if (window.keplr) {
            return window.keplr;
        }
        if (document.readyState === "complete") {
            return window.keplr;
        }
        return new Promise((resolve) => {
            const documentStateChange = (event) => {
                if (event.target &&
                    event.target.readyState === "complete") {
                    resolve(window.keplr);
                    document.removeEventListener("readystatechange", documentStateChange);
                }
            };
            document.addEventListener("readystatechange", documentStateChange);
        });
    });
}
getKeplr();
// get osmosis wallet address from keplr extension
// get osmosis balances
// display osmosis balances
// 
