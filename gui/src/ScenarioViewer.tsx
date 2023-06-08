/*
 * Copyright 2023 Avaiga Private Limited
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

import React, { useState, useCallback, useEffect, useMemo, ChangeEvent, SyntheticEvent, MouseEvent } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary, { AccordionSummaryProps } from "@mui/material/AccordionSummary";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material";
import { FlagOutlined, DeleteOutline, Add, Send, CheckCircle, Cancel, ArrowForwardIosSharp } from "@mui/icons-material";

import {
    createRequestUpdateAction,
    createSendActionNameAction,
    useDispatch,
    useDynamicProperty,
    useModule,
} from "taipy-gui";

import { FlagSx, Property, ScFProps, ScenarioFull, ScenarioFullLength } from "./utils";
import ConfirmDialog from "./utils/ConfirmDialog";

interface ScenarioViewerProps {
    id?: string;
    expandable?: boolean;
    expanded?: boolean;
    defaultExpanded?: boolean;
    updateVarName?: string;
    scenario?: ScenarioFull | Array<ScenarioFull>;
    onSubmit?: string;
    onEdit?: string;
    onDelete?: string;
    error?: string;
    coreChanged?: Record<string, unknown>;
    defaultActive: boolean;
    active: boolean;
    showConfig?: boolean;
    showCycle?: boolean;
    showDelete?: boolean;
    showPipelines?: boolean;
    showProperties?: boolean;
    showSubmit?: boolean;
    showSubmitPipelines?: boolean;
    showTags?: boolean;
}

interface PipelinesRowProps {
    active: boolean;
    number: number;
    id: string;
    label: string;
    enableScenarioFields: boolean;
    submitEntity: (id: string) => void;
    submit: boolean;
    editLabel: (id: string, label: string) => void;
    onFocus: (e: MouseEvent<HTMLElement>) => void;
    focusName: string;
    setFocusName: (name: string) => void;
}

const MainBoxSx = {
    overflowY: "auto",
};

const FieldNoMaxWidth = {
    maxWidth: "none",
};

const AccordionSummarySx = { fontSize: "0.9rem" };
const ChipSx = { ml: 1 };
const IconPaddingSx = { padding: 0 };
const DeleteIconSx = { height: 50, width: 50, p: 0 };

const tagsAutocompleteSx = {
    "& .MuiOutlinedInput-root": {
        padding: "3px 15px 3px 3px !important",
    },
    maxWidth: "none",
};

const hoverSx = {
    "&:hover": {
        bgcolor: "action.hover",
        cursor: "text",
    },
    mt: 0,
};

const disableColor = <T,>(color: T, disabled: boolean) => (disabled ? ("disabled" as T) : color);

const PipelineRow = ({
    active,
    number,
    id,
    label,
    submitEntity,
    enableScenarioFields,
    submit,
    editLabel,
    onFocus,
    focusName,
    setFocusName,
}: PipelinesRowProps) => {
    const [pipeline, setPipeline] = useState<string>(label);

    const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setPipeline(e.currentTarget.value), []);
    const onSaveField = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            editLabel(id, pipeline);
        },
        [id, pipeline]
    );
    const onCancelField = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            setPipeline(label);
            setFocusName("");
        },
        [label]
    );
    const onSubmitPipeline = useCallback(() => submitEntity(id), [submitEntity, id]);

    useEffect(() => setPipeline(label), [label]);

    const name = `pipeline${number}`;

    const index = number + 1;
    return (
        <Grid item xs={12} container justifyContent="space-between" data-focus={name} onClick={onFocus} sx={hoverSx}>
            <Grid item container xs={10}>
                {active && focusName === name ? (
                    <TextField
                        label={`Pipeline ${index}`}
                        variant="outlined"
                        value={pipeline}
                        onChange={onChange}
                        sx={FieldNoMaxWidth}
                        disabled={!enableScenarioFields}
                        fullWidth
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton sx={IconPaddingSx} onClick={onSaveField}>
                                        <CheckCircle color="primary" />
                                    </IconButton>
                                    <IconButton sx={IconPaddingSx} onClick={onCancelField}>
                                        <Cancel color="inherit" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                ) : (
                    <Typography variant="subtitle2">{pipeline}</Typography>
                )}
            </Grid>
            <Grid item xs={2} container alignContent="center" alignItems="center" justifyContent="center">
                {submit ? (
                    <IconButton size="small" onClick={onSubmitPipeline} disabled={!enableScenarioFields || !active}>
                        <Send color={disableColor("info", !enableScenarioFields)} />
                    </IconButton>
                ) : null}
            </Grid>
        </Grid>
    );
};

const MuiAccordionSummary = styled((props: AccordionSummaryProps) => (
    <AccordionSummary expandIcon={<ArrowForwardIosSharp sx={AccordionSummarySx} />} {...props} />
))(({ theme }) => ({
    flexDirection: "row-reverse",
    "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
        transform: "rotate(90deg)",
        marginRight: theme.spacing(1),
    },
    "& .MuiAccordionSummary-content": {
        marginLeft: theme.spacing(1),
    },
}));

const ScenarioViewer = (props: ScenarioViewerProps) => {
    const {
        id = "",
        expandable = true,
        showConfig = false,
        showCycle = false,
        showDelete = true,
        showProperties = true,
        showPipelines = true,
        showSubmit = true,
        showSubmitPipelines = true,
        showTags = false,
    } = props;

    const dispatch = useDispatch();
    const module = useModule();

    const [
        scenarioId = "",
        primary = false,
        scConfig = "",
        date = "",
        scLabel = "",
        scenarioTags = [],
        scenarioProperties = [],
        scPipelines = [],
        authorizedTags = [],
        deletable = false,
        isScenario = false,
    ] = useMemo(() => {
        const sc = Array.isArray(props.scenario)
            ? props.scenario.length == ScenarioFullLength && typeof props.scenario[ScFProps.id] === "string"
                ? (props.scenario as ScenarioFull)
                : props.scenario.length == 1
                ? (props.scenario[0] as ScenarioFull)
                : undefined
            : undefined;
        return sc ? [...sc, true] : [];
    }, [props.scenario]);

    const active = useDynamicProperty(props.active, props.defaultActive, true);
    const expanded = useDynamicProperty(props.expanded, props.defaultExpanded, false);

    const [deleteDialog, setDeleteDialogOpen] = useState(false);
    const openDeleteDialog = useCallback(() => setDeleteDialogOpen(true), []);
    const closeDeleteDialog = useCallback(() => setDeleteDialogOpen(false), []);
    const onDeleteScenario = useCallback(() => {
        setDeleteDialogOpen(false);
        if (isScenario) {
            dispatch(createSendActionNameAction(id, module, props.onDelete, true, true, { id: scenarioId }));
        }
    }, [isScenario, props.onDelete, scenarioId]);

    const [primaryDialog, setPrimaryDialog] = useState(false);
    const openPrimaryDialog = useCallback(() => setPrimaryDialog(true), []);
    const closePrimaryDialog = useCallback(() => setPrimaryDialog(false), []);
    const onPromote = useCallback(() => {
        setPrimaryDialog(false);
        if (isScenario) {
            dispatch(createSendActionNameAction(id, module, props.onEdit, { id: scenarioId, primary: true }));
        }
    }, [isScenario, props.onEdit, scenarioId]);

    const [scProperties, setProperties] = useState<Property[]>([]);
    const [newProp, setNewProp] = useState<Property>({
        id: "",
        key: "",
        value: "",
    });

    // submits
    const submitPipeline = useCallback(
        (pipelineId: string) => {
            dispatch(createSendActionNameAction(id, module, props.onSubmit, { id: pipelineId }));
        },
        [props.onSubmit]
    );

    const submitScenario = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            if (isScenario) {
                dispatch(createSendActionNameAction(id, module, props.onSubmit, { id: scenarioId }));
            }
        },
        [isScenario, props.onSubmit]
    );

    // focus
    const [focusName, setFocusName] = useState("");
    const onFocus = useCallback((e: MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        setFocusName(e.currentTarget.dataset.focus || "");
    }, []);

    // Label
    const [label, setLabel] = useState<string>();
    const editLabel = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            if (isScenario) {
                dispatch(createSendActionNameAction(id, module, props.onEdit, { id: scenarioId, name: label }));
                setFocusName("");
            }
        },
        [isScenario, props.onEdit, scenarioId, label]
    );
    const cancelLabel = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            setLabel(scLabel);
            setFocusName("");
        },
        [scLabel]
    );
    const onLabelChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setLabel(e.target.value), []);

    // tags
    const [scTags, setTags] = useState<string[]>([]);
    const editTags = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            if (isScenario) {
                dispatch(createSendActionNameAction(id, module, props.onEdit, { id: scenarioId, tags: scTags }));
                setFocusName("");
            }
        },
        [isScenario, props.onEdit, scenarioId, scTags]
    );
    const cancelTags = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            setTags(scenarioTags);
            setFocusName("");
        },
        [scenarioTags]
    );
    const onChangeTags = useCallback((_: SyntheticEvent, tags: string[]) => setTags(tags), []);

    // Properties
    const updatePropertyField = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { id = "", name = "" } = e.currentTarget.parentElement?.parentElement?.dataset || {};
        if (name) {
            if (id) {
                setProperties((props) =>
                    props.map((p) => {
                        if (id == p.id) {
                            p[name as keyof Property] = e.target.value;
                        }
                        return p;
                    })
                );
            } else {
                setNewProp((np) => ({ ...np, [name]: e.target.value }));
            }
        }
    }, []);

    const editProperty = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            if (isScenario) {
                const { id: propId = "" } = e.currentTarget.dataset || {};
                const property = propId ? scProperties.find((p) => p.id === propId) : newProp;
                property &&
                    dispatch(
                        createSendActionNameAction(id, module, props.onEdit, { id: scenarioId, properties: [property] })
                    );
                setNewProp((np) => ({ ...np, key: "", value: "" }));
                setFocusName("");
            }
        },
        [isScenario, props.onEdit, scenarioId, scProperties, newProp]
    );
    const cancelProperty = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();
            if (isScenario) {
                const { id: propId = "" } = e.currentTarget.dataset || {};
                const propertyIdx = scProperties.findIndex((p) => p.id === propId);
                propertyIdx > -1 &&
                    propertyIdx < scenarioProperties.length &&
                    setProperties((props) =>
                        props.map((p, idx) =>
                            idx == propertyIdx
                                ? { ...p, key: scenarioProperties[idx][0], value: scenarioProperties[idx][1] }
                                : p
                        )
                    );
                setFocusName("");
            }
        },
        [isScenario, props.onEdit, scenarioId, scProperties]
    );

    const deleteProperty = useCallback((e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        const { id: propId = "-1" } = e.currentTarget.dataset;
        setProperties((props) => props.filter((item) => item.id !== propId));
        const property = scProperties.find((p) => p.id === propId);
        property &&
            dispatch(
                createSendActionNameAction(id, module, props.onEdit, { id: scenarioId, deleted_properties: [property] })
            );
        setFocusName("");
    }, []);

    // pipelines
    const editPipeline = useCallback(
        (id: string, label: string) => {
            if (isScenario) {
                dispatch(createSendActionNameAction(id, module, props.onEdit, { id: id, name: label }));
                setFocusName("");
            }
        },
        [isScenario, props.onEdit]
    );

    // on scenario change
    useEffect(() => {
        showTags && setTags(scenarioTags);
        showProperties &&
            setProperties(
                scenarioProperties.map(([k, v], i) => ({
                    id: i + "",
                    key: k,
                    value: v,
                }))
            );
        setLabel(scLabel);
    }, [scenarioTags, scenarioProperties, scLabel]);

    // Refresh on broadcast
    useEffect(() => {
        const ids = props.coreChanged?.scenario;
        if (typeof ids === "string" ? ids === scenarioId : Array.isArray(ids) ? ids.includes(scenarioId) : ids) {
            props.updateVarName && dispatch(createRequestUpdateAction(id, module, [props.updateVarName], true));
        }
    }, [props.coreChanged, props.updateVarName, module, dispatch, scenarioId]);

    return (
        <>
            <Box sx={MainBoxSx} id={id} onClick={onFocus}>
                <Accordion defaultExpanded={expandable ? expanded : isScenario} disabled={!isScenario}>
                    <MuiAccordionSummary>
                        <Grid
                            container
                            alignItems="center"
                            direction="row"
                            flexWrap="nowrap"
                            justifyContent="space-between"
                            spacing={1}
                        >
                            <Grid item>
                                {scLabel}
                                {primary && (
                                    <Chip
                                        color="primary"
                                        label={<FlagOutlined sx={FlagSx} />}
                                        size="small"
                                        sx={ChipSx}
                                    />
                                )}
                            </Grid>
                            <Grid item>
                                {showSubmit ? (
                                    <IconButton
                                        sx={IconPaddingSx}
                                        onClick={submitScenario}
                                        disabled={!isScenario || !active}
                                    >
                                        <Send fontSize="medium" color={disableColor("info", !isScenario || !active)} />
                                    </IconButton>
                                ) : null}
                            </Grid>
                        </Grid>
                    </MuiAccordionSummary>
                    <AccordionDetails>
                        <Grid container rowSpacing={2}>
                            {showConfig ? (
                                <Grid item xs={12} container justifyContent="space-between">
                                    <Grid item xs={4} pb={2}>
                                        <Typography variant="subtitle2">Config ID</Typography>
                                    </Grid>
                                    <Grid item xs={8}>
                                        <Typography variant="subtitle2">{scConfig}</Typography>
                                    </Grid>
                                </Grid>
                            ) : null}
                            {showCycle ? (
                                <Grid item xs={12} container justifyContent="space-between">
                                    <Grid item xs={4}>
                                        <Typography variant="subtitle2">Cycle / Frequency</Typography>
                                    </Grid>
                                    <Grid item xs={8}>
                                        <Typography variant="subtitle2">{date}</Typography>
                                    </Grid>
                                </Grid>
                            ) : null}
                            <Grid item xs={12} container justifyContent="space-between" spacing={1}>
                                <Grid
                                    item
                                    xs={12}
                                    container
                                    justifyContent="space-between"
                                    data-focus="label"
                                    onClick={onFocus}
                                    sx={hoverSx}
                                >
                                    {active && focusName === "label" ? (
                                        <TextField
                                            label="Label"
                                            variant="outlined"
                                            fullWidth
                                            sx={FieldNoMaxWidth}
                                            value={label || ""}
                                            onChange={onLabelChange}
                                            InputProps={{
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton sx={IconPaddingSx} onClick={editLabel}>
                                                            <CheckCircle color="primary" />
                                                        </IconButton>
                                                        <IconButton sx={IconPaddingSx} onClick={cancelLabel}>
                                                            <Cancel color="inherit" />
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                            disabled={!isScenario}
                                        />
                                    ) : (
                                        <>
                                            <Grid item xs={4}>
                                                <Typography variant="subtitle2">Label</Typography>
                                            </Grid>
                                            <Grid item xs={8}>
                                                <Typography variant="subtitle2">{scLabel}</Typography>
                                            </Grid>
                                        </>
                                    )}{" "}
                                </Grid>
                                {showTags ? (
                                    <Grid
                                        item
                                        xs={12}
                                        container
                                        justifyContent="space-between"
                                        data-focus="tags"
                                        onClick={onFocus}
                                        sx={hoverSx}
                                    >
                                        {active && focusName === "tags" ? (
                                            <Autocomplete
                                                multiple
                                                options={authorizedTags}
                                                freeSolo={!authorizedTags.length}
                                                renderTags={(value: readonly string[], getTagProps) =>
                                                    value.map((option: string, index: number) => (
                                                        <Chip
                                                            variant="outlined"
                                                            label={option}
                                                            sx={IconPaddingSx}
                                                            {...getTagProps({ index })}
                                                        />
                                                    ))
                                                }
                                                value={scTags}
                                                onChange={onChangeTags}
                                                fullWidth
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        variant="outlined"
                                                        label="Tags"
                                                        sx={tagsAutocompleteSx}
                                                        fullWidth
                                                        InputProps={{
                                                            ...params.InputProps,
                                                            endAdornment: (
                                                                <>
                                                                    <IconButton sx={IconPaddingSx} onClick={editTags}>
                                                                        <CheckCircle color="primary" />
                                                                    </IconButton>
                                                                    <IconButton sx={IconPaddingSx} onClick={cancelTags}>
                                                                        <Cancel color="inherit" />
                                                                    </IconButton>
                                                                </>
                                                            ),
                                                        }}
                                                    />
                                                )}
                                                disabled={!isScenario}
                                            />
                                        ) : (
                                            <>
                                                <Grid item xs={4}>
                                                    <Typography variant="subtitle2">Tags</Typography>
                                                </Grid>
                                                <Grid item xs={8}>
                                                    {scTags.map((tag, index) => (
                                                        <Chip key={index} label={tag} variant="outlined" />
                                                    ))}
                                                </Grid>
                                            </>
                                        )}
                                    </Grid>
                                ) : null}
                            </Grid>

                            <Grid item xs={12}>
                                <Divider />
                            </Grid>
                            {showProperties ? (
                                <>
                                    <Grid item xs={12} container>
                                        <Typography variant="h6">Custom Properties</Typography>
                                    </Grid>
                                    <Grid item xs={12} container rowSpacing={2}>
                                        {scProperties
                                            ? scProperties.map((property) => {
                                                  const propName = `property-${property.id}`;
                                                  return (
                                                      <Grid
                                                          item
                                                          xs={12}
                                                          spacing={1}
                                                          container
                                                          justifyContent="space-between"
                                                          key={property.key}
                                                          data-focus={propName}
                                                          onClick={onFocus}
                                                          sx={hoverSx}
                                                      >
                                                          {active && focusName === propName ? (
                                                              <>
                                                                  <Grid item xs={4}>
                                                                      <TextField
                                                                          label="Key"
                                                                          variant="outlined"
                                                                          value={property.key}
                                                                          sx={FieldNoMaxWidth}
                                                                          disabled={!isScenario}
                                                                          data-name="key"
                                                                          data-id={property.id}
                                                                          onChange={updatePropertyField}
                                                                      />
                                                                  </Grid>
                                                                  <Grid item xs={6}>
                                                                      <TextField
                                                                          label="Value"
                                                                          variant="outlined"
                                                                          value={property.value}
                                                                          sx={FieldNoMaxWidth}
                                                                          disabled={!isScenario}
                                                                          data-name="value"
                                                                          data-id={property.id}
                                                                          onChange={updatePropertyField}
                                                                      />
                                                                  </Grid>
                                                                  <Grid
                                                                      item
                                                                      xs={1}
                                                                      container
                                                                      alignContent="center"
                                                                      alignItems="center"
                                                                      justifyContent="center"
                                                                  >
                                                                      <IconButton
                                                                          sx={IconPaddingSx}
                                                                          data-id={property.id}
                                                                          onClick={editProperty}
                                                                      >
                                                                          <CheckCircle color="primary" />
                                                                      </IconButton>
                                                                      <IconButton
                                                                          sx={IconPaddingSx}
                                                                          data-id={property.id}
                                                                          onClick={cancelProperty}
                                                                      >
                                                                          <Cancel color="inherit" />
                                                                      </IconButton>
                                                                  </Grid>
                                                                  <Grid
                                                                      item
                                                                      xs={1}
                                                                      container
                                                                      alignContent="center"
                                                                      alignItems="center"
                                                                      justifyContent="center"
                                                                  >
                                                                      <IconButton
                                                                          sx={DeleteIconSx}
                                                                          data-id={property.id}
                                                                          onClick={deleteProperty}
                                                                          disabled={!isScenario}
                                                                      >
                                                                          <DeleteOutline
                                                                              fontSize="small"
                                                                              color={disableColor(
                                                                                  "primary",
                                                                                  !isScenario
                                                                              )}
                                                                          />
                                                                      </IconButton>
                                                                  </Grid>
                                                              </>
                                                          ) : (
                                                              <>
                                                                  <Grid item xs={4}>
                                                                      <Typography variant="subtitle2">
                                                                          {property.key}
                                                                      </Typography>
                                                                  </Grid>
                                                                  <Grid item xs={6}>
                                                                      <Typography variant="subtitle2">
                                                                          {property.value}
                                                                      </Typography>
                                                                  </Grid>{" "}
                                                                  <Grid item xs={2} />
                                                              </>
                                                          )}
                                                      </Grid>
                                                  );
                                              })
                                            : null}
                                        <Grid
                                            item
                                            xs={12}
                                            spacing={1}
                                            container
                                            justifyContent="space-between"
                                            data-focus="property-new"
                                            onClick={onFocus}
                                            sx={hoverSx}
                                        >
                                            {active && focusName == "property-new" ? (
                                                <>
                                                    <Grid item xs={4}>
                                                        <TextField
                                                            value={newProp.key}
                                                            data-name="key"
                                                            onChange={updatePropertyField}
                                                            label="Key"
                                                            variant="outlined"
                                                            sx={FieldNoMaxWidth}
                                                            disabled={!isScenario}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <TextField
                                                            value={newProp.value}
                                                            data-name="value"
                                                            onChange={updatePropertyField}
                                                            label="Value"
                                                            variant="outlined"
                                                            sx={FieldNoMaxWidth}
                                                            disabled={!isScenario}
                                                        />
                                                    </Grid>
                                                    <Grid
                                                        item
                                                        xs={1}
                                                        container
                                                        alignContent="center"
                                                        alignItems="center"
                                                        justifyContent="center"
                                                    >
                                                        <IconButton sx={IconPaddingSx} onClick={editProperty}>
                                                            <CheckCircle color="primary" />
                                                        </IconButton>
                                                        <IconButton sx={IconPaddingSx} onClick={cancelProperty}>
                                                            <Cancel color="inherit" />
                                                        </IconButton>
                                                    </Grid>
                                                    <Grid item xs={1} />
                                                </>
                                            ) : (
                                                <>
                                                    <Grid item xs={4}>
                                                        <Typography variant="subtitle2">New Property Key</Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="subtitle2">Value</Typography>
                                                    </Grid>
                                                    <Grid item xs={2} />
                                                </>
                                            )}
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Divider />
                                    </Grid>
                                </>
                            ) : null}
                            {showPipelines ? (
                                <>
                                    <Grid item xs={12} container justifyContent="space-between">
                                        <Typography variant="h6">Pipelines</Typography>
                                    </Grid>

                                    {scPipelines &&
                                        scPipelines.map((item, index) => {
                                            const [key, value] = item;
                                            return (
                                                <PipelineRow
                                                    active={active}
                                                    number={index}
                                                    id={key}
                                                    label={value}
                                                    key={key}
                                                    submitEntity={submitPipeline}
                                                    enableScenarioFields={isScenario}
                                                    submit={showSubmitPipelines}
                                                    editLabel={editPipeline}
                                                    onFocus={onFocus}
                                                    focusName={focusName}
                                                    setFocusName={setFocusName}
                                                />
                                            );
                                        })}

                                    <Grid item xs={12}>
                                        <Divider />
                                    </Grid>
                                </>
                            ) : null}
                            <Grid item xs={12} container justifyContent="space-between">
                                {showDelete ? (
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        disabled={!active || !isScenario || !deletable}
                                        onClick={openDeleteDialog}
                                    >
                                        DELETE
                                    </Button>
                                ) : null}
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    disabled={!active || !isScenario || primary}
                                    onClick={openPrimaryDialog}
                                >
                                    PROMOTE TO PRIMARY
                                </Button>
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>
                <Box>{props.error}</Box>
            </Box>

            <ConfirmDialog
                title="Delete Scenario"
                message="Are you sure you want to delete this scenario?"
                confirm="Delete"
                open={deleteDialog}
                onClose={closeDeleteDialog}
                onConfirm={onDeleteScenario}
            />
            <ConfirmDialog
                title="Promote Scenario"
                message="Are you sure you want to promote this scenario?"
                confirm="Promote"
                open={primaryDialog}
                onClose={closePrimaryDialog}
                onConfirm={onPromote}
            />
        </>
    );
};
export default ScenarioViewer;