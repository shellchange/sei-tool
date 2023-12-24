import {
  restoreWallet,
  getSigningCosmWasmClient,
  getQueryClient,
} from "@sei-js/core";
import { calculateFee } from "@cosmjs/stargate";


export const RPC_URL = "https://sei-rpc.polkachu.com/";
export const REST_URL = "https://sei-api.polkachu.com/";
export const NETWORK = "pacific-1";

const mnemonic = "" // 这里填写助记词

const generateWalletFromMnemonic = async (m) => {
  const wallet = await restoreWallet(m, 0);//第二个参数可以切换钱包里不同的账户，比如：把0替换成1,0代表第一个账户，1代表第二个账户，以此类推
  return wallet;
};

const querySeiBalance = async (address) => {
  const queryClient = await getQueryClient(REST_URL);
  const result = await queryClient.cosmos.bank.v1beta1.balance({
    address: address,
    denom: "usei",
  });
  return result.balance;
};

function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}



async function main() {
  const wallet = await generateWalletFromMnemonic(mnemonic);
  const accounts = await wallet.getAccounts();
  const balance = await querySeiBalance(accounts[0].address);
  const address = accounts[0].address;
  console.log(balance);
  const msg = {
    p: "sei-20",
    op: "mint",
    tick: "seis",
    amt: "1000",
  };
  const msg_base64 = btoa(`data:,${JSON.stringify(msg)}`);
  const fee = calculateFee(100000, "0.1usei");

  const signingCosmWasmClient = await getSigningCosmWasmClient(RPC_URL, wallet);
  var successNum = 0;
  var failNum = 0;
  var mintCount = 10000;//mint次数，默认一万张


  for (let i = 1; i < mintCount; i++) {
    try{        
      const response = await signingCosmWasmClient.sendTokens(
        accounts[0].address,
        accounts[0].address,
        [{ amount: "1", denom: "usei" }],
        fee,
        msg_base64
      );
      console.log(response.transactionHash);
      console.log("钱包地址：" + address +"---第 " + i + " 次铸造，---共成功 "+ ++successNum +" 次---共失败 "+ failNum +" 次---" + new Date());
      await sleep(1500);//延迟1.5秒，增加mint成功概率
    }catch (e){
      failNum++;
      console.log("钱包地址：" + address +"*********第 " + failNum + " 次出现错误，时间：" + new Date() + "错误原因：" + e);
      await sleep(3000);//延迟3秒后再次发送
      continue;
    }
  }
}
main();
