const {withAndroidManifest,withDangerousMod,AndroidConfig}=require('@expo/config-plugins');
const fs=require('fs');const path=require('path');
function addComponent(list,item,key){const found=(list||[]).some(x=>x?.$?.['android:name']===key);return found?list:[...(list||[]),item]}
module.exports=function withRitimAndroidMedia(config){
 config=withAndroidManifest(config,c=>{
  const app=AndroidConfig.Manifest.getMainApplicationOrThrow(c.modResults);
  app['meta-data']=addComponent(app['meta-data'],{$:{'android:name':'com.google.android.gms.car.application','android:resource':'@xml/automotive_app_desc'}},'com.google.android.gms.car.application');
  return c;
 });
 config=withDangerousMod(config,['android',async c=>{
  const project=c.modRequest.platformProjectRoot;
  const xmlDir=path.join(project,'app','src','main','res','xml');
  fs.mkdirSync(xmlDir,{recursive:true});
  fs.writeFileSync(path.join(xmlDir,'automotive_app_desc.xml'),`<?xml version="1.0" encoding="utf-8"?><automotiveApp><uses name="media"/></automotiveApp>`);
  return c;
 }]);
 return config;
};
