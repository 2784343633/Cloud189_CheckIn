/**
 * 任务名称
 * name: cloud189_checkIn
 * 定时规则
 * cron: 1 9 * * *
 */

const { CloudClient } = require("cloud189-sdk")
const mask = (s, start, end) => s.split("").fill("*", start, end).join("");

// 任务 1.签到 2.天天抽红包 3.自动备份抽红包
const doTask = async (cloudClient) => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const result = [];
    const res1 = await cloudClient.userSign();
    result.push(
        `${res1.isSign ? "已经签到过了，" : ""}签到获得${res1.netdiskBonus}M空间`
    );
    await delay(3000); // 延迟3秒

    let index = 1;
    const buildResult = (index, res) => {
        console.log(res.errorCode)
        if (res.errorCode === "User_Not_Chance") {
            result.push(`第${index}次抽奖失败,次数不足`);
        } else if(res.errorCode === "RequestFrequent") {
            result.push(`第${index}次抽奖失败,请求频繁`)
        } else {
            result.push(`第${index}次抽奖成功,抽奖获得${res.prizeName}`);
        }
    };

    const res2 = await cloudClient.taskSign();
    buildResult(index, res2);

    index++;
    await delay(3000); // 延迟3秒
    const res3 = await cloudClient.taskPhoto();
    buildResult(index, res3);

    index++;
    await delay(3000); // 延迟3秒
    const res4 = await cloudClient.taskKJ();
    buildResult(index, res4);

    return result;
}

const doFamilyTask = async (cloudClient) => {
    const { familyInfoResp } = await cloudClient.getFamilyList();
    const result = [];
    if (familyInfoResp) {
        for (let index = 0; index < familyInfoResp.length; index += 1) {
            const { familyId } = familyInfoResp[index];
            const res = await cloudClient.familyUserSign(familyId);
            result.push(
                "家庭任务" +
                `${res.signStatus ? "已经签到过了，" : ""}签到获得${res.bonusSpace
                }M空间`
            );
        }
    }
    return result;
}

const USERNAME = process.env["CLOUD189_USER"]
const PASSWORD = process.env["CLOUD189_PASS"]

// 开始执行程序
async function main() {
    if (USERNAME && PASSWORD) {
        const userNameInfo = mask(USERNAME, 3, 7);
        try {
            console.log(`账户 ${userNameInfo}开始执行`);
            const cloudClient = new CloudClient(USERNAME, PASSWORD);
            await cloudClient.login();
            const result = await doTask(cloudClient);
            result.forEach((r) => console.log(r));
            const familyResult = await doFamilyTask(cloudClient);
            familyResult.forEach((r) => console.log(r));
            const { cloudCapacityInfo, familyCapacityInfo } =
                await cloudClient.getUserSizeInfo();
            console.log(
                `个人总容量：${(
                    cloudCapacityInfo.totalSize /
                    1024 /
                    1024 /
                    1024
                ).toFixed(2)}G,家庭总容量：${(
                    familyCapacityInfo.totalSize /
                    1024 /
                    1024 /
                    1024
                ).toFixed(2)}G`
            );
        } catch (e) {
            if (e.code === "ECONNRESET") {
                throw e;
            }
        } finally {
            console.log(`账户 ${userNameInfo}执行完毕`);
        }
    }
}

(async () => {
    await main();
  })();