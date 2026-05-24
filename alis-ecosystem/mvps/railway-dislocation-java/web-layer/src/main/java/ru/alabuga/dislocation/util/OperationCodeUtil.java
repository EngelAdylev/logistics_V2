package ru.alabuga.dislocation.util;

import java.util.Map;

public final class OperationCodeUtil {

    private static final Map<String, String> NAMES = Map.of(
        "96", "Прибыл к месту назначения",
        "20", "Убыл со станции",
        "61", "Задержан на промежуточной",
        "80", "Расформирован",
        "85", "Прицеплен"
    );

    private OperationCodeUtil() {}

    public static String getName(String code) {
        if (code == null) return null;
        return NAMES.getOrDefault(code, "Операция " + code);
    }
}
