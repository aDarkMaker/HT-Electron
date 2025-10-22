import grpc
from google.protobuf import empty_pb2
import clouddrive_pb2
import clouddrive_pb2_grpc


class CloudDriveClient:
    def __init__(self, address):
        """初始化 CloudDrive 客户端

        Args:
            address: 服务器地址 (例如 'localhost:19798')
        """
        self.channel = grpc.insecure_channel(address)
        self.stub = clouddrive_pb2_grpc.CloudDriveFileSrvStub(self.channel)
        self.jwt_token = None

    def close(self):
        """关闭通道"""
        self.channel.close()

    def authenticate(self, username, password):
        """认证并获取 JWT 令牌

        Args:
            username: 用户名
            password: 密码

        Returns:
            bool: 如果认证成功返回 True
        """
        request = clouddrive_pb2.GetTokenRequest(
            userName=username,
            password=password
        )

        response = self.stub.GetToken(request)

        if response.success:
            self.jwt_token = response.token
            print(f"认证成功。令牌过期时间: {response.expiration}")
            return True
        else:
            print(f"认证失败: {response.errorMessage}")
            return False

    def _create_authorized_metadata(self):
        """创建带授权头的元数据"""
        if not self.jwt_token:
            return []
        return [('authorization', f'Bearer {self.jwt_token}')]

    def get_system_info(self):
        """获取系统信息(无需认证)

        Returns:
            CloudDriveSystemInfo: 系统信息
        """
        return self.stub.GetSystemInfo(empty_pb2.Empty())

    def get_sub_files(self, path, force_refresh=False):
        """列出目录中的文件

        Args:
            path: 目录路径
            force_refresh: 强制刷新缓存

        Returns:
            list: CloudDriveFile 对象列表
        """
        request = clouddrive_pb2.ListSubFileRequest(
            path=path,
            forceRefresh=force_refresh
        )

        metadata = self._create_authorized_metadata()
        files = []

        for response in self.stub.GetSubFiles(request, metadata=metadata):
            files.extend(response.subFiles)

        return files

    def create_folder(self, parent_path, folder_name):
        """创建新文件夹

        Args:
            parent_path: 父目录路径
            folder_name: 新文件夹名称

        Returns:
            CreateFolderResult: 操作结果
        """
        request = clouddrive_pb2.CreateFolderRequest(
            parentPath=parent_path,
            folderName=folder_name
        )

        metadata = self._create_authorized_metadata()
        return self.stub.CreateFolder(request, metadata=metadata)

    def delete_file(self, file_path):
        """删除文件或文件夹

        Args:
            file_path: 文件或文件夹路径

        Returns:
            FileOperationResult: 操作结果
        """
        request = clouddrive_pb2.FileRequest(path=file_path)
        metadata = self._create_authorized_metadata()
        return self.stub.DeleteFile(request, metadata=metadata)

    def rename_file(self, file_path, new_name):
        """重命名文件

        Args:
            file_path: 当前文件路径
            new_name: 新文件名

        Returns:
            FileOperationResult: 操作结果
        """
        request = clouddrive_pb2.RenameFileRequest(
            theFilePath=file_path,
            newName=new_name
        )

        metadata = self._create_authorized_metadata()
        return self.stub.RenameFile(request, metadata=metadata)

    def move_file(self, source_paths, dest_path, conflict_policy=0):
        """移动文件到目标位置

        Args:
            source_paths: 源文件路径列表
            dest_path: 目标路径
            conflict_policy: 0=覆盖, 1=重命名, 2=跳过

        Returns:
            FileOperationResult: 操作结果
        """
        request = clouddrive_pb2.MoveFileRequest(
            theFilePaths=source_paths,
            destPath=dest_path,
            conflictPolicy=conflict_policy
        )

        metadata = self._create_authorized_metadata()
        return self.stub.MoveFile(request, metadata=metadata)

    def search_files(self, search_term, path="/", force_refresh=False, fuzzy_match=False):
        """搜索文件

        Args:
            search_term: 搜索查询
            path: 搜索根路径
            force_refresh: 强制刷新缓存
            fuzzy_match: 使用模糊匹配

        Returns:
            list: CloudDriveFile 对象列表
        """
        request = clouddrive_pb2.SearchRequest(
            searchFor=search_term,
            path=path,
            forceRefresh=force_refresh,
            fuzzyMatch=fuzzy_match
        )

        metadata = self._create_authorized_metadata()
        files = []

        for response in self.stub.GetSearchResults(request, metadata=metadata):
            files.extend(response.subFiles)

        return files

    def get_account_status(self):
        """获取账户状态和计划信息

        Returns:
            AccountStatusResult: 账户状态
        """
        metadata = self._create_authorized_metadata()
        return self.stub.GetAccountStatus(empty_pb2.Empty(), metadata=metadata)

    def get_download_url(self, path, preview=False, lazy_read=False):
        """获取文件下载 URL

        Args:
            path: 文件路径
            preview: 预览模式
            lazy_read: 延迟读取模式

        Returns:
            DownloadUrlPathInfo: 下载 URL 信息
        """
        request = clouddrive_pb2.GetDownloadUrlPathRequest(
            path=path,
            preview=preview,
            lazy_read=lazy_read
        )

        metadata = self._create_authorized_metadata()
        return self.stub.GetDownloadUrlPath(request, metadata=metadata)


# 使用示例
def main():
    client = CloudDriveClient('localhost:19798')

    try:
        # 获取系统信息
        sys_info = client.get_system_info()
        print(f"系统就绪: {sys_info.SystemReady}, 用户: {sys_info.UserName}")

        # 认证
        if client.authenticate('your-username', 'your-password'):
            # 列出根目录
            files = client.get_sub_files('/')
            print(f"找到 {len(files)} 个文件")

            for file in files:
                file_type = "目录" if file.isDirectory else "文件"
                print(f"{file.name} ({file.size} 字节) - {file_type}")

            # 创建文件夹
            result = client.create_folder('/', 'MyNewFolder')
            if result.result.success:
                print(f"文件夹已创建: {result.folderCreated.fullPathName}")
            else:
                print(f"创建文件夹失败: {result.result.errorMessage}")

            # 搜索文件
            search_results = client.search_files('test', '/')
            print(f"找到 {len(search_results)} 个匹配文件")

            # 获取账户状态
            account = client.get_account_status()
            print(f"账户: {account.userName}, 余额: {account.accountBalance}")
            print(f"计划: {account.accountPlan.planName}")

    finally:
        client.close()


if __name__ == '__main__':
    main()