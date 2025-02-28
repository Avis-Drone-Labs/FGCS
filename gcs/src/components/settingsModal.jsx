import { Checkbox, Input, Modal, NativeSelect, Tabs } from "@mantine/core";
import { useSettings } from "../helpers/settings";

import DefaultSettings from "../../data/default_settings.json"
import { memo } from "react";

function TextSetting({settingName}){
    const {getSetting, setSetting} = useSettings();
    return <Input value={getSetting(settingName)} onChange={(e) => setSetting(settingName, e.currentTarget.value)}/>
}

function BoolSetting({settingName}){
    const {getSetting, setSetting} = useSettings();
    return <Checkbox checked={getSetting(settingName)} onChange={(e) => setSetting(settingName, e.currentTarget.checked)}/>
}

function OptionSetting({settingName, options}){
    const {getSetting, setSetting} = useSettings();
    return <NativeSelect data={options} value={getSetting(settingName)} onChange={(e) => setSetting(settingName, e.currentTarget.value)}/>
}

function Setting({settingName, df}){
    return (
        <div className="flex flex-row justify-between items-center h-[5vh] px-10 ">
            <div>{df.display}:</div>
            {df.type == "number" ? <TextSetting settingName={settingName}/> :
                df.type=="boolean" ? <BoolSetting settingName={settingName}/> :
                df.type=="option" ? <OptionSetting settingName={settingName} options={df.options}/> : <TextSetting settingName={settingName}/>}
        </div>
    )
}

function SettingsModal(){

    const settingTabs = Object.keys(DefaultSettings);

    const { opened, close } = useSettings();

    return (
        <Modal onClose={close} title="User Settings" opened={opened} size={"50%"} styles={{content: {backgroundColor: "rgb(23 26 27)"}, header: {backgroundColor: "rgb(23 26 27)"}}} bg="bg-falcongrey-900" radius="15px" shadow="xs">

            <Tabs defaultValue="General" orientation="vertical" className="bg-falcongrey-900" color="#BA1B0B" h="50vh" styles={{list: {width: "15%"}}}>
                <Tabs.List>
                    {settingTabs.map((t) => {
                        return <Tabs.Tab key={t} value={t}>{t}</Tabs.Tab>
                    })}
                </Tabs.List>
                {settingTabs.map((t) => {
                    return <Tabs.Panel value={t}>{Object.keys(DefaultSettings[t]).map((s) => {return <Setting settingName={`${t}.${s}`} df={DefaultSettings[t][s]} key={`${t}.${s}`}/>})}</Tabs.Panel>
                })}
            </Tabs>
        </Modal>
    )

}

// If settings don't change then the modal does not need to re-render
export default memo(SettingsModal);
