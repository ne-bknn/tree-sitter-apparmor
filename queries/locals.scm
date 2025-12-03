; Local scopes and variable definitions for AppArmor grammar

; Profile creates a new scope
(profile) @local.scope

; Modifier blocks create nested scopes
(modifier_block) @local.scope

; Conditional blocks create scopes
(conditional_rule) @local.scope

; Tunable variable definitions at top level
(tunables_assignment_line
  var: (tunable_var) @local.definition)

; Conditional variable definitions
(conditional_var_assignment_line
  var: (conditional_var) @local.definition)

; Profile name definitions
(profile_header
  name: (_) @local.definition)

(profile_header_bare
  name: (_) @local.definition)

(profile_header_hat
  name: (profile_name) @local.definition)

(profile_header_hat_keyword
  name: (profile_name) @local.definition)

; Variable references
(tunable_var) @local.reference
(var_path) @local.reference
(cond_var) @local.reference
(cond_bool_var) @local.reference

; Alias definitions (source -> target mapping)
(alias_line
  source: (_) @local.definition)
