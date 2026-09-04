import * as IntentLauncher from 'expo-intent-launcher';

export async function openSystemEqualizer(){
  try{
    return await IntentLauncher.startActivityAsync('android.media.action.DISPLAY_AUDIO_EFFECT_CONTROL_PANEL',{extra:{'android.media.extra.PACKAGE_NAME':'com.ritim.music','android.media.extra.AUDIO_SESSION':0}});
  }catch{
    return IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.SOUND_SETTINGS);
  }
}
export const openBluetoothSettings=()=>IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.BLUETOOTH_SETTINGS);
export const openBatteryOptimization=()=>IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
export const openAppDetails=()=>IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,{data:'package:com.ritim.music'});
