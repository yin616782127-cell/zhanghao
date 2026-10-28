import { Input, List, Tag } from 'antd';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHead } from '../components';
import { useApp } from '../store';

export default function KnowledgePage() {
  const { id } = useParams();
  const { state } = useApp();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const article = state.articles.find((item) => item.id === id);
  if (article) {
    return (
      <div>
        <PageHead title={article.title} desc={`${article.category} · 更新 ${article.updatedAt}`} extra={<a onClick={() => navigate('/knowledge')}>返回</a>} />
        <div className="panel">
          {article.sections.map((section) => (
            <div key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          ))}
        </div>
      </div>
    );
  }
  const rows = state.articles.filter((item) => `${item.title}${item.summary}${item.category}`.includes(keyword.trim()));
  return (
    <div>
      <PageHead title="知识库" desc="实施范式、售后分诊、下发规则和服务日志。处理人标注可复用后，解决方案会出现在这里。" />
      <div className="panel">
        <Input.Search placeholder="搜索标题或摘要" style={{ marginBottom: 12, maxWidth: 360 }} onSearch={setKeyword} allowClear />
        <List
          dataSource={rows}
          renderItem={(item) => (
            <List.Item style={{ cursor: 'pointer' }} onClick={() => navigate(`/knowledge/${item.id}`)}>
              <List.Item.Meta title={<span>{item.title} <Tag>{item.category}</Tag></span>} description={item.summary} />
              <span className="muted">{item.updatedAt}</span>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
}
