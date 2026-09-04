import * as IntentLauncher from 'expo-intent-launcher';
export async function openSystemEqualizer(){try{return await IntentLauncher.startActivityAsync('android.media.action.DISPLAY_AUDIO_EFFECT_CONTROL_PANEL',{extra:{'android.media.extra.PACKAGE_NAME':'com.ritim.music','android.media.extra.AUDIO_SESSION':0}})}catch{return IntentLauncher.startActivityAsync('android.settings.SOUND_SETTINGS')}}
export const openBluetoothSettings=()=>IntentLauncher.startActivityAsync('android.settings.BLUETOOTH_SETTINGS');
export const openBatteryOptimization=()=>IntentLauncher.startActivityAsync('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
export const openAppDetails=()=>IntentLauncher.startActivityAsync('android.settings.APPLICATION_DETAILS_SETTINGS',{data:'package:com.ritim.music'});
