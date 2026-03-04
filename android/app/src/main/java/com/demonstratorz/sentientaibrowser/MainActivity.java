package com.demonstratorz.sentientaibrowser;

import com.facebook.react.ReactActivity;
import android.os.Bundle;
import android.webkit.WebView;
import android.widget.LinearLayout;
import android.view.ViewGroup;
import android.app.Activity;

public class MainActivity extends ReactActivity {
    @Override
    protected String getMainComponentName() {
        return "main";
    }

    // Optionally, override onCreate to set up a WebView-like experience
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // If you want to show a WebView directly (not typical for React Native), uncomment below:
        // WebView webView = new WebView(this);
        // webView.loadUrl("https://www.example.com");
        // LinearLayout layout = new LinearLayout(this);
        // layout.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        // layout.addView(webView);
        // setContentView(layout);
    }
}
