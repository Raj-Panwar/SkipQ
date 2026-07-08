package com.skipq.backend.dto;

import java.util.List;

public class PreLoginQueueDTO {
    private Integer currentServingToken;
    private List<Integer> queueTokens;

    public PreLoginQueueDTO(Integer currentServingToken, List<Integer> queueTokens) {
        this.currentServingToken = currentServingToken;
        this.queueTokens = queueTokens;
    }

    public Integer getCurrentServingToken() {
        return currentServingToken;
    }

    public void setCurrentServingToken(Integer currentServingToken) {
        this.currentServingToken = currentServingToken;
    }

    public List<Integer> getQueueTokens() {
        return queueTokens;
    }

    public void setQueueTokens(List<Integer> queueTokens) {
        this.queueTokens = queueTokens;
    }
}