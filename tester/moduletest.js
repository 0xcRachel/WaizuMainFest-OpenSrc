
const APP_ID = '2358720';

async function checkBranch(appId) {
    const url = `https://api.github.com/repos/SteamAutoCracks/ManifestHub/branches/${appId}`;
    try {
        const res = await fetch(url);
        if (res.status === 200) {
            console.log(`Branch exists: ${appId}`);
            return true;
        } else if (res.status === 404) {
            console.log(`Branch not found: ${appId}`);
            return false;
        } else {
            console.log(`Error status: ${res.status}`);
            return false;
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
        return false;
    }
}

async function testDownload(appId) {
    const url = `https://codeload.github.com/SteamAutoCracks/ManifestHub/zip/refs/heads/${appId}`;
    try {
        const res = await fetch(url);
        if (res.ok) {
            console.log(`Download OK: ${appId}`);
            return true;
        } else {
            console.log(`Download failed: ${res.status}`);
            return false;
        }
    } catch (err) {
        console.log(`Error: ${err.message}`);
        return false;
    }
}

(async () => {
    console.log(`Test AppID: ${APP_ID}`);
    const branchExists = await checkBranch(APP_ID);
    if (branchExists) {
        await testDownload(APP_ID);
    } else {
        console.log('Skip download');
    }
})();

