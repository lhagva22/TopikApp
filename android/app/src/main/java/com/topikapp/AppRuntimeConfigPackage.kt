package com.topikapp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.uimanager.ViewManager

class AppRuntimeConfigModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName(): String = "AppRuntimeConfig"

    override fun getConstants(): Map<String, Any> = mapOf("apiUrl" to BuildConfig.TOPIK_API_URL)
}

class AppRuntimeConfigPackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
        listOf(AppRuntimeConfigModule(context))

    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
