import ChatWidget from '../components/ChatWidget';
import { PageWrap, PageHeader } from '../components/GlassUI';

export default function Chat() {
  return (
    <PageWrap>
      <PageHeader
        title="AI Coach — Alex"
        subtitle="CBT-based productivity coaching personalised to your burnout data"
      />
      <div style={{ height: 'calc(100vh - 11rem)' }}>
        <ChatWidget fullPage />
      </div>
    </PageWrap>
  );
}
