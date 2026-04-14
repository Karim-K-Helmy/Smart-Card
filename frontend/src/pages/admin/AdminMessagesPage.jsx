import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { markAdminNotificationAsRead } from '../../services/api/admin';
import { deleteMessage, listMessages, replyToMessage, updateMessageStatus } from '../../services/api/messages';
import { extractApiError, formatDate } from '../../utils/api';

const BADGE_SYNC_EVENT = 'dashboard-badge-sync';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: '' });

  const load = async () => {
    try {
      const { data } = await listMessages();
      setMessages(data.data.data || []);
      setStatus({ loading: false, error: '' });
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.allSettled([markAdminNotificationAsRead('messages'), load()]);
      window.dispatchEvent(new CustomEvent(BADGE_SYNC_EVENT, { detail: { area: 'admin', key: 'messages' } }));
    };

    init();
  }, []);

  const changeStatus = async (messageId, nextStatus) => {
    try {
      await updateMessageStatus(messageId, { status: nextStatus });
      await load();
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  const handleReply = async (msg) => {
    const replyText = window.prompt(`اكتب الرد على ${msg.email}`, `مرحبًا ${msg.name}،

شكرًا على رسالتك.
`);
    if (!replyText) return;
    try {
      await replyToMessage(msg._id, { replyText, subject: `رد بخصوص: ${msg.subject}` });
      await load();
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  const handleDelete = async (msg) => {
    if (!window.confirm(`هل تريد حذف رسالة "${msg.subject}" نهائيًا من قاعدة البيانات؟`)) return;

    try {
      await deleteMessage(msg._id);
      await load();
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error) });
    }
  };

  return (
    <div className="stack-lg">
      <PageHeader
        title="رسائل التواصل"
        text="يمكنك الرد على العميل مباشرة من داخل النظام أو حذف الرسائل نهائيًا من قاعدة البيانات."
      />
      {status.error ? <Card><p className="error-text">{status.error}</p></Card> : null}
      <div className="stack-md">
        {messages.map((msg) => (
          <Card
            key={msg._id}
            title={msg.subject}
            action={<Badge tone={msg.status === 'new' ? 'warning' : msg.status === 'archived' ? 'default' : 'info'}>{msg.status}</Badge>}
          >
            <p><strong>{msg.name}</strong> — {msg.email} — {msg.phone || '-'}</p>
            <p>{msg.message}</p>
            {msg.lastReplyText ? (
              <div className="notice-card notice-success">
                <strong>آخر رد مرسل</strong>
                <p>{msg.lastReplyText}</p>
              </div>
            ) : null}
            <div className="row-actions">
              <Button onClick={() => handleReply(msg)}>رد مباشر</Button>
              <Button variant="ghost" onClick={() => changeStatus(msg._id, msg.status === 'archived' ? 'read' : 'archived')}>
                {msg.status === 'archived' ? 'تحديد كمقروء' : 'أرشفة'}
              </Button>
              {msg.status === 'new' ? <Button variant="secondary" onClick={() => changeStatus(msg._id, 'read')}>تعليم كمقروء</Button> : null}
              <Button variant="danger" onClick={() => handleDelete(msg)}>حذف نهائي</Button>
            </div>
            <small>{formatDate(msg.createdAt)}</small>
          </Card>
        ))}
      </div>
    </div>
  );
}
