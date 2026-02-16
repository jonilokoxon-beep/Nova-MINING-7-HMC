package com.nova.mining;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
  @Override
  protected void onCreate(Bundle b) {
    super.onCreate(b);
    WebView w = new WebView(this);
    w.getSettings().setJavaScriptEnabled(true);
    w.loadUrl("https://TU_GITHUB_PAGES/index.html");
    setContentView(w);
  }
}
