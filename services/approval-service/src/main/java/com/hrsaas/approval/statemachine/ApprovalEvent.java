package com.hrsaas.approval.statemachine;

public enum ApprovalEvent {
    SUBMIT,
    APPROVE_LINE,
    REJECT_LINE,
    AGREE_LINE,
    RECALL,
    CANCEL,
    COMPLETE,
    ARBITRARY_APPROVE
}
