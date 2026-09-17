package com.hyperproof.risk.entity;

public enum SeverityBand {
    LOW(1, 5, "#22c55e", "Low"),
    MEDIUM(6, 12, "#eab308", "Medium"),
    HIGH(13, 19, "#f97316", "High"),
    CRITICAL(20, 25, "#ef4444", "Critical");

    private final int minScore;
    private final int maxScore;
    private final String colorHex;
    private final String displayName;

    SeverityBand(int minScore, int maxScore, String colorHex, String displayName) {
        this.minScore = minScore;
        this.maxScore = maxScore;
        this.colorHex = colorHex;
        this.displayName = displayName;
    }

    public int getMinScore() {
        return minScore;
    }

    public int getMaxScore() {
        return maxScore;
    }

    public String getColorHex() {
        return colorHex;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static SeverityBand fromScore(int score) {
        if (score <= 5) {
            return LOW;
        } else if (score <= 12) {
            return MEDIUM;
        } else if (score <= 19) {
            return HIGH;
        } else {
            return CRITICAL;
        }
    }
}
