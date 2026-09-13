"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createRecord, deleteRecord, listRecords, retryRecordAnalysis, type RecordEntry } from "@/shared/api/miniu";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Icon } from "@/shared/ui/icon";
import { Surface } from "@/shared/ui/surface";

const RECORD_MAX_LENGTH = 150;

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(`${value}T00:00:00`));
}

function analysisLabel(status: RecordEntry["analysisStatus"]): string {
  switch (status) {
    case "pending":
      return "분석 중";
    case "complete":
      return "분석 완료";
    case "failedTemporary":
      return "분석 실패 (재시도 가능)";
    case "failedPermanent":
      return "분석 불가";
  }
}

export function RecordPreview() {
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [content, setContent] = useState("");
  const [happenedOn, setHappenedOn] = useState(todayDateInput());
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listRecords()
      .then((data) => {
        if (!cancelled) {
          setRecords(data.records);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "기록을 불러오지 못했어요.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submitRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > RECORD_MAX_LENGTH) {
      return;
    }
    setPending(true);
    setStatus("");
    try {
      const data = await createRecord({ content: trimmed, happenedOn: happenedOn || todayDateInput() });
      setRecords((current) => [data.record, ...current]);
      setContent("");
      setStatus("기록을 저장했어요.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "기록을 저장하지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  async function removeRecord(record: RecordEntry) {
    setPending(true);
    setStatus("");
    try {
      await deleteRecord(record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setStatus("기록을 삭제했어요.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "기록을 삭제하지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  async function retryAnalysis(record: RecordEntry) {
    setPending(true);
    setStatus("");
    try {
      const data = await retryRecordAnalysis(record.id);
      setRecords((current) => current.map((item) => (item.id === record.id ? data.record : item)));
      setStatus("다시 분석했어요.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "다시 분석하지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="preview record-preview" aria-labelledby="record-title">
      <div className="page-heading">
        <span className="eyebrow">LITTLE THINGS I LEARNED</span>
        <h1 id="record-title">오늘 알게 된 것</h1>
        <p>연인에 대해 알게 된 걸 짧게 남겨보세요.</p>
      </div>
      {status && <p className="preview-footnote">{status}</p>}
      <form className="record-form" onSubmit={submitRecord}>
        <textarea
          className="step-textarea"
          rows={2}
          maxLength={RECORD_MAX_LENGTH}
          placeholder="예: 아이스 아메리카노를 제일 좋아한대"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="record-form-row">
          <input type="date" className="field-box-input" value={happenedOn} max={todayDateInput()} onChange={(event) => setHappenedOn(event.target.value)} />
          <span className="record-form-count">{content.length}/{RECORD_MAX_LENGTH}</span>
        </div>
        <Button type="submit" fullWidth disabled={pending || !content.trim()}>기록 저장</Button>
      </form>
      <div className="section-heading">
        <h2>기록 목록</h2>
        <span>{records.length}건</span>
      </div>
      <div className="record-list">
        {records.length ? (
          records.map((record) => (
            <Surface key={record.id} className="record-item">
              <div className="record-item-body">
                <p>{record.content}</p>
                <span className="letter-date">{formatDate(record.happenedOn)} · {analysisLabel(record.analysisStatus)}</span>
              </div>
              <div className="chip-list">
                {record.analysisStatus === "failedTemporary" && (
                  <Button variant="secondary" disabled={pending} onClick={() => retryAnalysis(record)}>다시 분석</Button>
                )}
                <Button variant="ghost" disabled={pending} aria-label="기록 삭제" onClick={() => removeRecord(record)}>
                  <Icon name="close" width={16} height={16} />
                </Button>
              </div>
            </Surface>
          ))
        ) : (
          <EmptyState title="아직 남긴 기록이 없어요" description="첫 기록을 남겨보세요." />
        )}
      </div>
      <p className="preview-footnote">기록 작성·조회·삭제·재분석이 실제 API와 연결됐어요</p>
    </section>
  );
}
