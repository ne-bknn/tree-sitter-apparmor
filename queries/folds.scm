; Folds for AppArmor grammar
; Profile blocks
(profile) @fold

; Modifier blocks (audit { }, deny { }, owner { }, etc.)
(modifier_block) @fold

; Conditional blocks
(conditional_rule) @fold

; Multiline rules with continuation fragments
(dbus_rule_line
  (dbus_cont_fragment)) @fold

(unix_rule_line
  (unix_cont_fragment)) @fold

(signal_rule_line
  (signal_cont_fragment)) @fold

; Flags and xattrs (when spanning multiple lines in practice)
(flags) @fold
(xattrs) @fold
