// import { chain, assets, asset_list, testnet, testnet_assets } from '@chain-registry/osmosis';
import { Keplr } from "@keplr-wallet/types";
import Long from "long";

// import { WalletManager } from '@cosmos-kit/core';
import { osmosis } from "osmojs";
import { PageRequest } from "osmojs/types/codegen/cosmos/base/query/v1beta1/pagination";
import { Coin } from "osmojs/types/codegen/cosmos/base/v1beta1/coin";
// console.log(chain);

// const wm = new WalletManager("")

// import { createApp } from "vue";
// import App from "./src/App.vue";

(async () => {
  // waits for window.keplr to exist (if extension is installed, enabled and injecting it's content script)
  await getKeplr();
  // ok keplr is present... enable chain
  await keplr_connectOsmosis();
  //

  // await getOsmosisWallet().then((wallet) => {
  //   if (wallet) {
  //     // keplr_onAfterConnected();
  //     //const offlineSigner = window.getOfflineSigner(chainId);
  //   }
  // });

  // keplr extension installed and enabled
})();

async function keplr_connectOsmosis(): Promise<void> {
  await window.keplr
    ?.enable("osmosis-1")
    .then(async () => {
      // Connected
      keplr_chains_onConnected();
    })
    .catch(() => {
      // Rejected
      keplr_chains_onRejected();
    });
}

// get osmosis wallet from user's selected account in keplr extension
async function getOsmosisWallet(): Promise<
  | {
      name: string;
      algo: string;
      pubKey: Uint8Array;
      address: Uint8Array;
      bech32Address: string;
    }
  | undefined
> {
  ui_resetForm();
  const wallet = await window.keplr?.getKey("osmosis-1").then((user_key) => {
    console.log(user_key);
    return user_key;
  });
  ui_showElementById("container_unbondedLPs");
  return wallet;
}

// get osmosis balances

// display osmosis balances

// INITIALIZATION:
async function getKeplr(): Promise<Keplr | undefined> {
  if (window.keplr) {
    return window.keplr;
  }

  if (document.readyState === "complete") {
    return window.keplr;
  }

  return new Promise((resolve) => {
    const documentStateChange = (event: Event) => {
      if (
        event.target &&
        (event.target as Document).readyState === "complete"
      ) {
        resolve(window.keplr);
        document.removeEventListener("readystatechange", documentStateChange);
      }
    };

    document.addEventListener("readystatechange", documentStateChange);
  });
}

// EVENT HANDLERS
async function keplr_chains_onConnected(): Promise<void> {
  ui_resetForm();
  const wallet = await getOsmosisWallet();
  ui_setWallet(wallet);
  // update UI
  ui_showElementById("container_unbondedLPs");

  // register event handler: if user changes account:
  window.addEventListener("keplr_keystorechange", keplr_keystore_onChange);

  //const offlineSigner = window.getOfflineSigner(chainId);
}

async function keplr_chains_onRejected(): Promise<void> {
  ui_resetForm();
  ui_setWallet(undefined);
}

async function keplr_keystore_onChange(e: any): Promise<void> {
  const wallet = await getOsmosisWallet();
  ui_setWallet(wallet);
}

// EXPORTED TO A GLOBAL "module" OBJECT FOR INLINE HTML DOM EVENT LISTENERS

export async function btnConnectKeplr_onClick(): Promise<void> {
  // connect Keplr wallet extension
  await keplr_connectOsmosis();
}

let selectedGamm: {
  denom: string | undefined;
  amount: string | undefined;
} = { denom: "", amount: "0" };
export function select_gamms_onChange(el: HTMLSelectElement) {
  //if selected is gamm, then show bonding durations
  if (el.value == "") {
    ui_hideElementById("container_bondingdurations");
  } else {
    const option_selectedGamm = el.options[el.selectedIndex];
    selectedGamm = {
      denom: option_selectedGamm?.dataset.denom,
      amount: option_selectedGamm?.dataset.amount,
    };
    ui_showElementById("container_bondingdurations");
  }
}

//dataset.amount
export function btn_bond_onClick(duration_days: number) {
  console.log(selectedGamm);
  console.log(duration_days);
}

export function btn_gammAmountMax_onClick() {
  let input_gammAmountToBond = <HTMLInputElement>(
    document.getElementById("input_gammAmountToBond")
  );
  if (selectedGamm.amount) {
    const amount = Long.fromString(selectedGamm.amount);
    input_gammAmountToBond.value = Math.floor(amount.toNumber()).toString();
  }
}

export function btn_gammAmountHalf_onClick() {
  let input_gammAmountToBond = <HTMLInputElement>(
    document.getElementById("input_gammAmountToBond")
  );
  if (selectedGamm.amount) {
    const amount = Long.fromString(selectedGamm.amount);
    input_gammAmountToBond.value = Math.floor(
      amount.div(2).toNumber()
    ).toString();
  }
}

export async function btnCheckUnbondedGammAmounts(): Promise<void> {
  ui_toggleMask("Loading unbonded LP balances...");
  const { createRPCQueryClient } = osmosis.ClientFactory;
  const client = await createRPCQueryClient({
    rpcEndpoint: "https://rpc.osmosis.interbloc.org",
  });
  let address: string | undefined;
  await getOsmosisWallet().then((res) => {
    address = res?.bech32Address;
  });
  if (address) {
    const response = await client.cosmos.bank.v1beta1.allBalances({
      address: address,
      pagination: {
        key: new Uint8Array(),
        offset: new (Long as any).fromString("0"),
        limit: new (Long as any).fromString("1000"),
        countTotal: true,
        reverse: false,
      },
    });
    const arrCoins = response.balances;
    const gamms: Coin[] = [];
    for (const coin of arrCoins) {
      if (coin.denom.indexOf("gamm") == 0) {
        gamms.push(coin);
      }
    }
    ui_renderGamms(gamms);
  }
  ui_toggleMask();
}

// UI FUNCTIONS
function ui_setWallet(
  wallet:
    | {
        name: string;
        algo: string;
        pubKey: Uint8Array;
        address: Uint8Array;
        bech32Address: string;
      }
    | undefined
): void {
  ui_resetForm();
  if (wallet) {
    document.querySelector(
      "#wallet-status"
    )!.innerHTML = `${wallet.bech32Address} - ${wallet.name}`;
    document.getElementById("btnConnectKeplr_text")!.textContent =
      "Reconnect Keplr Wallet";
    ui_showElementById("container_unbondedLPs");
  } else {
    document.querySelector(
      "#wallet-status"
    )!.innerHTML = `WALLET NOT CONNECTED`;
    document.getElementById("btnConnectKeplr_text")!.textContent =
      "Connect Keplr Wallet";
  }
}

function ui_resetForm() {
  ui_hideElementById("container_unbondedLPs"); //step 1
  ui_hideElementById("container_select_gamms"); //step 2
  // ui_hideElementById("select_gamms"); //step 2
  ui_hideElementById("container_bondingdurations"); //step 3
  ui_clearGamms();
}

function ui_renderGamms(gamms: Coin[]) {
  ui_clearGamms();
  const el_selectGamms = document.querySelector("#select_gamms");
  if (gamms.length == 0) {
    //todo set message

    ui_showElementById("msg_gammsEmpty");
    return;
  }
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.innerHTML = `2. Select an LP from this list`;
  el_selectGamms?.append(defaultOption);

  for (const coin of gamms) {
    const option = document.createElement("option");
    option.innerHTML = `<b>${coin.denom}</b> - ${coin.amount}`;
    if (option instanceof HTMLOptionElement) {
      option.value = coin.denom;
      option.dataset.denom = coin.denom;
      option.dataset.amount = coin.amount;
    }
    el_selectGamms?.append(option);
  }
  ui_hideElementById("msg_gammsEmpty");

  ui_showElementById("container_select_gamms");
}

function ui_toggleMask(text: string = "Loading...") {
  document.querySelector("#mask")?.classList.toggle("hidden");
  document.querySelector("#mask div")!.innerHTML = text;
}

function ui_clearGamms() {
  ui_hideElementById("container_select_gamms");
  document.querySelector("#select_gamms")!.innerHTML = "";
}

function ui_showElementById(elId: string) {
  document.querySelector(`#${elId}`)?.classList.remove("hidden");
}
function ui_hideElementById(elId: string) {
  document.querySelector(`#${elId}`)?.classList.add("hidden");
}
