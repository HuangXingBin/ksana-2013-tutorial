del tutorial.zip

cd ..
cd ..
ksana\zip -q -r -9 tutorial.zip ksana/ksanadb/node_modules/* ksana/ksanadb/cjkutil.js ksana/ksanadb/ydb4.worker.js ksana/ksanadb/invert.js ksana/ksanadb/splitter.js ksana/ksanadb/base64.js ksana/ksanadb/search.js ksana/ksanadb/yadb3*.js ksana/ksanadb/yadm*.js ksana/ksanadb/yafs3*.js ksana/ksanadb/plist.js ksana/ksanadb/diff.js ksana/ksanadb/diffutil.js ksana/ksanadb/binarysearch.js ksana/ksanadb/tokens.js ksana/ksanadb/buildydb4.proj.js ksana/ksanadb/rpc_yadm*.js ksana/ksanadb/rpc.js ksana/tutorial/*.js ksana/ksanadb/invert4.js ksana/ksanadb/objhelper.js ksana/launcher/node_modules/* ksana/launcher/builder.js ksana/launcher/pathutil.js ksana/launcher/session.js ksana/launcher/server.js ksana/launcher/restart.js ksana/launcher/rpc_node.js ksana/launcher/rpc.js ksana/launcher/services.js ksana/launcher/api*.js ksana/launcher/dirty.js ksana/launcher/defbuilder.js ksana/launcher/ksanalauncher.min.js ksana/launcher/socket.io.js ksana/launcher/portavail.js ksana/tutorial/*.bat ksana/tutorial/*.xml ksana/tutorial/*.html ksana/tutorial/*.txt ksana/tutorial/*.js ksana/tutorial/daodejin.ydb ksana/tutorial.bat ksana/tutorial.command
move /y tutorial.zip ksana\tutorial
cd ksana\tutorial
@echo deploy file tutorial.zip generated
@pause