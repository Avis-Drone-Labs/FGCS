import { Modal } from "@mantine/core";
import { useSettings } from "../helpers/settings";


export default function SettingsModal({isOpen}){

    const {settings} = useSettings();

    const settingTabs = Object.keys(settings);

    console.log(settingTabs);

    return (
        <Modal opened={isOpen} title="Settings" size={"70%"}>
            <div>skibidi toiled</div>
        </Modal>
    )

}
