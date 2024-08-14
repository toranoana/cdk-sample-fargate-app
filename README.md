(TODO: ブログのリンク)で紹介しているコードです。

# 事前準備

先に [AWS CLI](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-install.html) をインストールし、[セットアップ](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/getting-started-quickstart.html)を済ませてください。

AWSアカウントで初めてCDKを使う場合は以下のコマンドを実行しておく必要があります。

```shell
npm run cdk -- bootstrap
```

# リソース作成

1. (省略可).envファイルの用意
```shell
cp .env.sample .env
```
2. ECSサービス以外のリソース作成
```shell
bin/deploy.sh
```
3. イメージビルドとECRリポジトリへPush
```shell
bin/build_and_push.sh
```
4. ECSサービスを含めたリソース作成
```shell
bin/deploy.sh
```

# リソース破棄

```shell
npm run cdk -- destroy
```

CloudWatchロググループとECRリポジトリは削除されません。
手動で削除する必要があります。
