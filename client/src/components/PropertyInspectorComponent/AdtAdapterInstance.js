/* eslint-disable */
import { ADTAdapter } from '@microsoft/iot-cardboard-js';
import { configService } from "../../services/ConfigService";

const getAdtAdapter = async () => {
    const { appAdtUrl } = await configService.getConfig();
    return new ADTAdapter(new URL(appAdtUrl).hostname, {
        getToken: () => 'abc',
        login: () => null
    })
}

export default getAdtAdapter;