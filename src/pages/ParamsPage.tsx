import { Alert, Table } from 'antd';
import { BIZ_PARAMS, DIRECT_PARAMS } from '../seed';
import { PageHead } from '../components';

export default function ParamsPage({ kind }: { kind: 'direct' | 'biz' }) {
  const direct = kind === 'direct';
  return (
    <div>
      <PageHead
        title={direct ? '直联参数' : '业务参数'}
        desc="只读。数据来自应管已有能力，本平台不维护、不回写。"
      />
      <Alert type="info" showIcon message="数据来源：应管 · 只读接入" description="证书、限额、审批级数以应管为准。实施和售后在这里核对，不在这里修改。" />
      <div className="panel" style={{ marginTop: 12 }}>
        {direct ? (
          <Table size="small" rowKey={(row) => `${row.tenantNo}-${row.bank}`} pagination={false} dataSource={DIRECT_PARAMS} columns={[
            { title: '客户', dataIndex: 'customerName' },
            { title: '租户号', dataIndex: 'tenantNo' },
            { title: '银行', dataIndex: 'bank' },
            { title: '接口', dataIndex: 'api' },
            { title: '通讯', dataIndex: 'channel' },
            { title: '证书到期', dataIndex: 'expire' },
            { title: '状态', dataIndex: 'status' },
            { title: '最近同步', dataIndex: 'synced' },
          ]} />
        ) : (
          <Table size="small" rowKey={(row) => `${row.customerName}-${row.item}`} pagination={false} dataSource={BIZ_PARAMS} columns={[
            { title: '客户', dataIndex: 'customerName' },
            { title: '参数组', dataIndex: 'group' },
            { title: '参数项', dataIndex: 'item' },
            { title: '当前值', dataIndex: 'value' },
            { title: '最近同步', dataIndex: 'synced' },
          ]} />
        )}
      </div>
    </div>
  );
}
