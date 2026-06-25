package com.skipq.backend.dto;

public class QueueInfoDTO {

    private Integer tokenNumber;
    private String status;
    private Integer currentServing;
    private Integer peopleAhead;
    private Integer estimatedWait;

    public QueueInfoDTO() {}

    public QueueInfoDTO(Integer tokenNumber, String status,
                        Integer currentServing,
                        Integer peopleAhead,
                        Integer estimatedWait) {
        this.tokenNumber = tokenNumber;
        this.status = status;
        this.currentServing = currentServing;
        this.peopleAhead = peopleAhead;
        this.estimatedWait = estimatedWait;
    }

    public Integer getTokenNumber() {
        return tokenNumber;
    }

    public void setTokenNumber(Integer tokenNumber) {
        this.tokenNumber = tokenNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getCurrentServing() {
        return currentServing;
    }

    public void setCurrentServing(Integer currentServing) {
        this.currentServing = currentServing;
    }

    public Integer getPeopleAhead() {
        return peopleAhead;
    }

    public void setPeopleAhead(Integer peopleAhead) {
        this.peopleAhead = peopleAhead;
    }

    public Integer getEstimatedWait() {
        return estimatedWait;
    }

    public void setEstimatedWait(Integer estimatedWait) {
        this.estimatedWait = estimatedWait;
    }
}